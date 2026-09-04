-- Evidence-first auto-ingest pipeline.
-- Raw parser page guesses are treated as evidence inputs, not authoritative records.
-- High-confidence structural facts and controlled historical evidence can be archived automatically.

create table if not exists import.extraction_lexicon (
  id bigserial primary key,
  record_type text not null check (record_type in ('material','practice','terminology')),
  canonical_name text not null,
  match_pattern text not null,
  category text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(record_type, canonical_name)
);

revoke all on import.extraction_lexicon from public, anon, authenticated;

-- Seeded controlled lexicon for the first WPA volume. Future source-specific terms can be added
-- without changing parser code.
insert into import.extraction_lexicon(record_type,canonical_name,match_pattern,category,description) values
('material','Slippery Elm','slippery ellum|slippery elm','botanical','Historically documented materia medica.'),
('material','Poke Salad Root','poke salad root','botanical','Historically documented materia medica.'),
('material','Mayapple Root','may[- ]apple root','botanical','Historically documented materia medica.'),
('material','Red Oak Bark','red oak bark','botanical','Historically documented materia medica.'),
('material','Horehound','hoarhound|horehound','botanical','Historically documented materia medica.'),
('material','Black Snake Root','black snake root','botanical','Historically documented materia medica.'),
('material','Calamus Root','calomus root|calamus root','botanical','Historically documented materia medica.'),
('material','Pennyroyal','pennyroil|pennyroyal','botanical','Historically documented materia medica.'),
('material','Dock','\mdock\M','botanical','Historically documented materia medica.'),
('material','Sage','\msage\M','botanical','Historically documented materia medica.'),
('material','Tansy','\mtansy\M','botanical','Historically documented materia medica.'),
('material','Thyme','\mthyme\M','botanical','Historically documented materia medica.'),
('material','Yarrow','\myarrow\M','botanical','Historically documented materia medica.'),
('material','Samson Snake Root','samson snake root','botanical','Historically documented materia medica.'),
('material','Butterfly Weed','butterfly weed','botanical','Historically documented materia medica.'),
('material','Asafetida','asafetida','botanical','Historically documented protective/medicinal material.'),
('material','Jerusalem Oak Seed','jerusalem oak seed','botanical','Historically documented materia medica.'),
('material','Jerusalem Weed','jerusalem weed','botanical','Historically documented materia medica.'),
('material','Mullein','mullen|mullein','botanical','Historically documented materia medica.'),
('material','Horse Mint','horse mint','botanical','Historically documented materia medica.'),
('material','Life Everlasting','life everlastin','botanical','Historically documented materia medica.'),
('material','China Berry Root','china berry','botanical','Historically documented materia medica.'),
('material','Lobelia','lobelia','botanical','Historically documented materia medica.'),
('material','Sweet Gum Turpentine','sweet gum turpentine','botanical','Historically documented materia medica.'),
('material','Mutton Suet','mutton suet','animal','Historically documented remedy ingredient.'),
('material','Turpentine','\mturpentine\M','other','Historically documented remedy ingredient.'),
('material','Soot','\msoot\M','other','Historically documented remedy ingredient.'),
('material','Cottonwood','cotton ?wood','botanical','Historically documented remedy ingredient.'),
('material','Sheep Thrash','sheep thrash','botanical','Historically documented remedy ingredient.'),
('material','Cloves','\mcloves\M','botanical','Historically documented remedy ingredient.'),
('material','Watermelon Seed','watermelon seeds?','botanical','Historically documented remedy ingredient.'),
('material','Mustard Seed','mustard seeds?','botanical','Historically documented spiritual material.'),
('material','Flour Sifter','flour sifter|\msifter\M','object','Historically documented protective object.'),
('material','Holed Dime','dime (wid|with) (de|the|a) hole|dime wid de hole','object','Historically documented protective object.'),
('material','Rabbit Foot','rabbit foot','animal','Historically documented charm object.'),
('practice','Mustard seeds used to delay a haint','mustard seeds?.{0,160}(ha[’'' ]?nt|ghost)|(ha[’'' ]?nt|ghost).{0,160}mustard seeds?','protection','Mustard seeds scattered so a haint must count them before proceeding.'),
('practice','Fresh lard used to stop spirit sight','stir.{0,80}fresh lard.{0,160}(sperit|spirit)|(sperit|spirit).{0,160}fresh lard','spirit work','Fresh lard stirring described as ending the ability to see spirits.'),
('practice','Rabbit foot carried for luck or protection','rabbit foot','charm','Rabbit foot carried as a luck/protective custom.'),
('practice','Flour sifter and fork kept by bed against witches','(sifter|flour sifter).{0,100}fork.{0,180}(witch|ridin)|(witch|ridin).{0,180}(sifter|flour sifter)','protection','Sifter and fork kept near the bed against witch-riding.'),
('practice','Holed dime worn to keep off conjure','dime.{0,80}hole.{0,120}(conjer|conjure)','protection','Holed dime worn as protection from conjure.'),
('practice','Conjure bag carried to prevent sickness','conjure bags?.{0,120}(sick|sickness)','protection','Conjure bag described as protection against sickness.'),
('practice','Hush water used to quiet a person','hush water','conjure','Hush water described as prepared water intended to quiet a person.'),
('practice','Personal clothing placed in running water to work on a person','(garter|stockin).{0,160}runnin[g’'' ]* water','conjure','Personal clothing placed in running water as a working on the owner.'),
('practice','Conjure powder burned with personal cloth','conjer powder|conjure powder','conjure','Conjure powder used with a personal clothing fragment.'),
('practice','Washpot turned down during prayer meeting','wash ?pot.{0,180}(prayer|voice)|(prayer|voice).{0,180}wash ?pot','religious folk practice','Washpot turned down at the door during prayer meetings to contain sound.'),
('practice','Axe placed under bed for night sweats','axe.{0,120}under de bed|axe.{0,120}under the bed','folk medicine','Axe placed beneath a sick person’s bed for night sweats.'),
('practice','Fresh egg placed at door to keep visitors away','fresh laid (aig|egg).{0,160}(visitor|come in)','folk practice','Fresh egg placed at the door to discourage visitors.'),
('practice','Egg on an upright pin used to call a sweetheart home','pin.{0,160}(aig|egg).{0,180}sweetheart|sweetheart.{0,180}(aig|egg)','love working','Egg balanced on an upright pin as a return-working for a sweetheart.'),
('terminology','Haint','ha[’'' ]?nt','historical spiritual terminology','Historical term for a ghost/spirit apparition.'),
('terminology','Conjure doctor','conjure doctor|conjer doctor|cunjer doctor','historical practitioner term','Historical term for a conjure practitioner.'),
('terminology','Hoodoo doctor','hoodoo doctor','historical practitioner term','Historical term for a Hoodoo practitioner.'),
('terminology','Hush water','hush water','historical conjure term','Prepared water described as being used to quiet a person.'),
('terminology','Conjure bag','conjure bags?','historical conjure term','Bag carried or sold for a conjure purpose.'),
('terminology','Discerning eye','[’'' ]?zernin[’'' ]? eye|discerning eye','historical spiritual term','Term used for an ability to see spirits.')
on conflict (record_type, canonical_name) do update set match_pattern=excluded.match_pattern, category=excluded.category, description=excluded.description, active=true;

-- Function bodies are installed by the live migration and intentionally kept in DB migration history.
-- See Supabase migration 041_evidence_first_auto_ingest_pipeline for the complete deployed SQL.
