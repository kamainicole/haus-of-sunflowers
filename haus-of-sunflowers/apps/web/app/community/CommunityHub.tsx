"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./CommunityHub.module.css";

type Post = {
  id: string;
  author_id: string;
  post_type: string;
  circle: string;
  title: string;
  body: string;
  source_title: string | null;
  source_author: string | null;
  source_year: string | null;
  page_ref: string | null;
  source_excerpt: string | null;
  interpretation: string | null;
  media_path: string | null;
  media_kind: "image" | "video" | null;
  created_at: string;
};

type Profile = { user_id: string; display_name: string };
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string };
type Reaction = { post_id: string; user_id: string; reaction_type: string };
type Follow = { follower_id: string; following_id: string };

const POST_TYPES = [
  ["question", "Ask the Commons"],
  ["research_note", "Field Note"],
  ["source_share", "Source Share"],
  ["practice_reflection", "Practice Reflection"],
  ["formula_discussion", "Formula Discussion"],
  ["historical_finding", "Historical Finding"],
  ["compare_discuss", "Compare & Discuss"],
  ["working_share", "Working Share"],
] as const;

const CIRCLES = ["commons","protection","cleansing","prosperity","love","ancestors","materia","formulation","historical_research"];

const REACTIONS = [
  ["notes", "📓 Adding to my notes"],
  ["curious", "🔎 I want to research this"],
  ["changed_mind", "✦ Changed my thinking"],
  ["sunflower", "🌻 Sunflower"],
] as const;

const typeLabel = (value: string) => POST_TYPES.find(([key]) => key === value)?.[1] ?? value;
const pretty = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());

export function CommunityHub() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [postType, setPostType] = useState("question");
  const [circle, setCircle] = useState("commons");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [sourceYear, setSourceYear] = useState("");
  const [pageRef, setPageRef] = useState("");
  const [sourceExcerpt, setSourceExcerpt] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  async function loadCommunity() {
    setLoading(true);
    setStatus("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus("Please sign in to enter the Study Commons.");
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [{ data: postData, error: postError }, { data: commentData }, { data: reactionData }, { data: followData }] = await Promise.all([
      supabase.schema("research").from("community_posts").select("*").order("created_at", { ascending: false }).limit(80),
      supabase.schema("research").from("community_comments").select("*").order("created_at", { ascending: true }),
      supabase.schema("research").from("community_reactions").select("post_id,user_id,reaction_type"),
      supabase.schema("research").from("community_follows").select("follower_id,following_id"),
    ]);
    if (postError) setStatus(postError.message);

    const loadedPosts = (postData ?? []) as Post[];
    setPosts(loadedPosts);
    setComments((commentData ?? []) as Comment[]);
    setReactions((reactionData ?? []) as Reaction[]);
    setFollows((followData ?? []) as Follow[]);

    const ids = Array.from(new Set([user.id, ...loadedPosts.map((p) => p.author_id), ...((commentData ?? []) as Comment[]).map((c) => c.author_id)]));
    if (ids.length) {
      const { data: profileData } = await supabase.schema("research").from("community_profiles").select("user_id,display_name").in("user_id", ids);
      const map: Record<string, Profile> = {};
      ((profileData ?? []) as Profile[]).forEach((p) => { map[p.user_id] = p; });
      setProfiles(map);
      const own = map[user.id]?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rootworker";
      setDisplayName(own);
    }

    const urlEntries = await Promise.all(loadedPosts.filter((p) => p.media_path).map(async (post) => {
      const { data } = await supabase.storage.from("community-media").createSignedUrl(post.media_path!, 3600);
      return [post.id, data?.signedUrl ?? ""] as const;
    }));
    setMediaUrls(Object.fromEntries(urlEntries.filter(([, url]) => Boolean(url))));
    setLoading(false);
  }

  useEffect(() => { void loadCommunity(); }, []);

  async function saveProfile() {
    if (!userId || !displayName.trim()) return;
    const { error } = await supabase.schema("research").from("community_profiles").upsert({
      user_id: userId,
      display_name: displayName.trim(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async function publishPost() {
    if (!userId || !title.trim() || !body.trim()) {
      setStatus("Give your post a title and tell the Commons what you are thinking.");
      return;
    }
    setStatus("Planting your note in the Commons…");
    try {
      await saveProfile();
      let mediaPath: string | null = null;
      let mediaKind: "image" | "video" | null = null;
      if (mediaFile) {
        const ext = mediaFile.name.split(".").pop() || "bin";
        mediaPath = `${userId}/${crypto.randomUUID()}.${ext}`;
        mediaKind = mediaFile.type.startsWith("video/") ? "video" : "image";
        const { error: uploadError } = await supabase.storage.from("community-media").upload(mediaPath, mediaFile, { upsert: false });
        if (uploadError) throw uploadError;
      }
      const { error } = await supabase.schema("research").from("community_posts").insert({
        author_id: userId,
        post_type: postType,
        circle,
        title: title.trim(),
        body: body.trim(),
        source_title: sourceTitle.trim() || null,
        source_author: sourceAuthor.trim() || null,
        source_year: sourceYear.trim() || null,
        page_ref: pageRef.trim() || null,
        source_excerpt: sourceExcerpt.trim() || null,
        interpretation: interpretation.trim() || null,
        media_path: mediaPath,
        media_kind: mediaKind,
      });
      if (error) throw error;
      setTitle(""); setBody(""); setSourceTitle(""); setSourceAuthor(""); setSourceYear(""); setPageRef(""); setSourceExcerpt(""); setInterpretation(""); setMediaFile(null);
      setStatus("Your discovery is now in the Commons. ✦");
      await loadCommunity();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something interrupted the post.");
    }
  }

  async function toggleReaction(postId: string, reactionType: string) {
    const exists = reactions.some((r) => r.post_id === postId && r.user_id === userId && r.reaction_type === reactionType);
    if (exists) {
      await supabase.schema("research").from("community_reactions").delete().eq("post_id", postId).eq("user_id", userId).eq("reaction_type", reactionType);
    } else {
      await supabase.schema("research").from("community_reactions").insert({ post_id: postId, user_id: userId, reaction_type: reactionType });
    }
    await loadCommunity();
  }

  async function addComment(postId: string) {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    await saveProfile();
    const { error } = await supabase.schema("research").from("community_comments").insert({ post_id: postId, author_id: userId, body: text });
    if (!error) {
      setCommentDrafts((old) => ({ ...old, [postId]: "" }));
      await loadCommunity();
    }
  }

  async function toggleFollow(authorId: string) {
    const exists = follows.some((f) => f.follower_id === userId && f.following_id === authorId);
    if (exists) await supabase.schema("research").from("community_follows").delete().eq("follower_id", userId).eq("following_id", authorId);
    else await supabase.schema("research").from("community_follows").insert({ follower_id: userId, following_id: authorId });
    await loadCommunity();
  }

  const visiblePosts = filter === "all" ? posts : posts.filter((p) => p.circle === filter || p.post_type === filter);
  const sourceMode = ["research_note", "source_share", "historical_finding", "compare_discuss"].includes(postType);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.spark}>The Study Commons ✦ research together, think for yourself</div>
        <h1>A curious little corner for rootworkers.</h1>
        <p>Ask questions, share workings, trade sources, compare notes, follow a research trail, and come back to tell the Commons what you discovered.</p>
      </section>

      <div className={styles.shell}>
        <main className={styles.main}>
          <section className={styles.composer}>
            <div className={styles.composerTop}>
              <div><div className={styles.spark}>Open your field notebook</div><h2>What did you notice?</h2></div>
              <button className={styles.secondary} onClick={() => { setPostType("research_note"); setTitle("What I found while researching…"); }}>✦ Start a Field Note</button>
            </div>
            <div className={styles.grid2}>
              <label><span className={styles.label}>Your study name</span><input className={styles.field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How should the Commons know you?" /></label>
              <label><span className={styles.label}>Gathering circle</span><select className={styles.select} value={circle} onChange={(e) => setCircle(e.target.value)}>{CIRCLES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}</select></label>
            </div>
            <div className={styles.toolbar}>{POST_TYPES.map(([key, label]) => <button key={key} className={postType === key ? styles.chipActive : styles.chip} onClick={() => setPostType(key)}>{label}</button>)}</div>
            <label><span className={styles.label}>Title</span><input className={styles.field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your thought a name…" /></label>
            <label><span className={styles.label}>Your note</span><textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What are you wondering, testing, comparing, or learning?" /></label>

            {sourceMode && <div className={styles.sourceBox}>
              <div className={styles.spark}>Tie it to the evidence</div>
              <div className={styles.grid2}>
                <input className={styles.field} value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="Source title" />
                <input className={styles.field} value={sourceAuthor} onChange={(e) => setSourceAuthor(e.target.value)} placeholder="Author / collector" />
                <input className={styles.field} value={sourceYear} onChange={(e) => setSourceYear(e.target.value)} placeholder="Year" />
                <input className={styles.field} value={pageRef} onChange={(e) => setPageRef(e.target.value)} placeholder="Page / chapter" />
              </div>
              <label><span className={styles.label}>What the source actually says</span><textarea className={styles.textarea} value={sourceExcerpt} onChange={(e) => setSourceExcerpt(e.target.value)} placeholder="Short excerpt or your precise source note" /></label>
              <label><span className={styles.label}>My interpretation</span><textarea className={styles.textarea} value={interpretation} onChange={(e) => setInterpretation(e.target.value)} placeholder="Separate what the source documents from what you think it means." /></label>
            </div>}

            <div className={styles.actions}>
              <label className={styles.secondary}>📷 Add image / video<input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)} /></label>
              <button className={styles.button} onClick={publishPost}>Plant it in the Commons 🌻</button>
            </div>
            {mediaFile && <div className={styles.success}>Attached: {mediaFile.name}</div>}
            {status && <div className={status.includes("now") || status.includes("Planting") ? styles.success : styles.error}>{status}</div>}
          </section>

          <div className={styles.feedHeader}>
            <h2>Notes drifting through the Commons</h2>
            <div className={styles.circleList}><button className={filter === "all" ? styles.chipActive : styles.chip} onClick={() => setFilter("all")}>All</button>{["formulation","materia","historical_research","cleansing","protection"].map((c) => <button key={c} className={filter === c ? styles.chipActive : styles.chip} onClick={() => setFilter(c)}>{pretty(c)}</button>)}</div>
          </div>

          {loading ? <div className={styles.empty}>Gathering field notes…</div> : visiblePosts.length === 0 ? <div className={styles.empty}><strong>The table is waiting.</strong>Be the first person to bring a question, source, experiment, or discovery to this circle.</div> : visiblePosts.map((post) => {
            const author = profiles[post.author_id]?.display_name || "A fellow researcher";
            const postComments = comments.filter((c) => c.post_id === post.id);
            const followed = follows.some((f) => f.follower_id === userId && f.following_id === post.author_id);
            return <article className={styles.post} key={post.id}>
              <div className={styles.postHead}>
                <div className={styles.author}><div className={styles.avatar}>{author.slice(0,1).toUpperCase()}</div><div><div className={styles.name}>{author}</div><div className={styles.meta}>{pretty(post.circle)} · {new Date(post.created_at).toLocaleDateString()}</div></div></div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}><span className={styles.typeBadge}>{typeLabel(post.post_type)}</span>{post.author_id !== userId && <button className={styles.chip} onClick={() => toggleFollow(post.author_id)}>{followed ? "Following ✦" : "Follow"}</button>}</div>
              </div>
              <h2>{post.title}</h2>
              <p className={styles.postBody}>{post.body}</p>
              {(post.source_title || post.source_excerpt || post.interpretation) && <div className={styles.researchNote}>
                {post.source_title && <><strong>Source</strong><p>{[post.source_title, post.source_author, post.source_year, post.page_ref].filter(Boolean).join(" · ")}</p></>}
                {post.source_excerpt && <><strong>Evidence note</strong><p>{post.source_excerpt}</p></>}
                {post.interpretation && <><strong>Researcher&apos;s interpretation</strong><p>{post.interpretation}</p></>}
              </div>}
              {post.media_kind === "image" && mediaUrls[post.id] && <img className={styles.media} src={mediaUrls[post.id]} alt="Community working shared by member" />}
              {post.media_kind === "video" && mediaUrls[post.id] && <video className={styles.media} src={mediaUrls[post.id]} controls preload="metadata" />}
              <div className={styles.reactions}>{REACTIONS.map(([key,label]) => { const count = reactions.filter((r) => r.post_id === post.id && r.reaction_type === key).length; const mine = reactions.some((r) => r.post_id === post.id && r.user_id === userId && r.reaction_type === key); return <button key={key} className={`${styles.reaction} ${mine ? styles.reactionOn : ""}`} onClick={() => toggleReaction(post.id,key)}>{label}{count ? ` · ${count}` : ""}</button>; })}</div>
              <div className={styles.comments}>{postComments.map((comment) => <div className={styles.comment} key={comment.id}><strong>{profiles[comment.author_id]?.display_name || "Researcher"}: </strong>{comment.body}</div>)}</div>
              <div className={styles.commentRow}><input className={styles.field} value={commentDrafts[post.id] ?? ""} onChange={(e) => setCommentDrafts((old) => ({...old,[post.id]:e.target.value}))} placeholder="Add a thought, source lead, or question…" /><button className={styles.secondary} onClick={() => addComment(post.id)}>Reply</button></div>
            </article>;
          })}
        </main>

        <aside className={styles.aside}>
          <section className={styles.asideCard}><div className={styles.spark}>Today&apos;s curiosity quest</div><h3>Follow one thread.</h3><div className={styles.quest}><strong>Find the earliest source you can.</strong><p>Choose one herb, root, practice, or phrase you use today. Find an older source that documents it, then post what the source actually says and what surprised you.</p><button className={styles.secondary} onClick={() => { setPostType("historical_finding"); setCircle("historical_research"); setTitle("Curiosity Quest: earliest source I found"); window.scrollTo({top:0,behavior:"smooth"}); }}>Accept quest ✦</button></div></section>
          <section className={styles.asideCard}><div className={styles.spark}>Curiosity trail</div><h3>From “I heard” to “I found.”</h3><div className={styles.trail}>{["Notice a claim","Search the archive","Read the source","Separate evidence from interpretation","Bring your finding back"].map((step,i) => <div className={styles.trailStep} key={step}><span className={styles.dot}>{i+1}</span>{step}</div>)}</div></section>
          <section className={styles.asideCard}><div className={styles.spark}>Gathering circles</div><h3>Wander where your curiosity pulls you.</h3><div className={styles.circleList}>{CIRCLES.slice(1).map((c) => <button className={filter === c ? styles.chipActive : styles.chip} key={c} onClick={() => setFilter(c)}>{pretty(c)}</button>)}</div></section>
        </aside>
      </div>
    </>
  );
}
