DROP TABLE IF EXISTS userclasses;
CREATE TABLE userclasses (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    user  INT    NOT NULL,
    class INT    NOT NULL,
    FOREIGN KEY (
        user
    )
    REFERENCES user (id),
    FOREIGN KEY (
        class
    )
    REFERENCES classes (id) 
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    uid  TEXT NOT NULL,
    name TEXT NOT NULL,
    nick TEXT
);

DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    role           TEXT    NOT NULL,
    short          TEXT    NOT NULL,
    specialization TEXT    NOT NULL,
    class          TEXT    NOT NULL   
);


INSERT INTO classes (role,short,specialization, class) VALUES 
('Heal','HAT','Tempest','Elementalist'),
('Power','PT','Tempest','Elementalist'),
('Condi','CT','Tempest','Elementalist'),
('Power','PW','Weaver','Elementalist'),
('Condi','CW','Weaver','Elementalist'),

('P Boon','PBC','Chronomancer','Mesmer'),
('C Boon','CBC','Chronomancer','Mesmer'),
('Tank','TC','Chronomancer','Mesmer'),
('Power','PC','Chronomancer','Mesmer'),
('Condi','CC','Chronomancer','Mesmer'),
('Condi','CM','Mirage','Mesmer'),

('Power','PR','Reaper','Necromancer'),
('Condi','CS','Scourge','Necromancer'),
('Heal','HS','Scourge','Necromancer'),

('Condi','CI','Engineer','Engineer'),
('Heal','HS','Scrapper','Engineer'),
('Power','PH','Holosmith','Engineer'),
('Condi','CH','Holosmith','Engineer'),

('Heal','HD','Druid','Ranger'),
('Condi','CD','Druid','Ranger'),
('Power','PS','Soulbeast','Ranger'),
('Condi','CS','Soulbeast','Ranger'),
('Handkite','HKS','Soulbeast','Ranger'),

('Boon','BT','Thief','Thief'),
('Power','PDD','Daredevil','Thief'),
('Boon','BDD','Daredevil','Thief'),
('Rifle','RDE','Deadeye','Thief'),
('Power','PDE','Deadeye','Thief'),

('Power','PG','Guardian','Guardian'),
('Power','PDH','Dragonhunter','Guardian'),
('Condi','CFB','Firebrand','Guardian'),
('PQuickness','PQB','Firebrand','Guardian'),
('CQuickness','CQB','Firebrand','Guardian'),
('Heal','HFB','Firebrand','Guardian'),

('Boon','BH','Herald','Revenant'),
('Handkite','HKH','Herald','Revenant'),
('Condi','CR','Renegade','Revenant'),
('PAlac','PAR','Renegade','Revenant'),
('CAlac','CAR','Renegade','Revenant'),
('Heal','HR','Renegade','Revenant'),

('P Banner','PBW','Warrior','Warrior'),
('P Banner','PBS','Berserker','Warrior'),
('C Banner','CBS','Berserker','Warrior'),
('Power','PB','Berserker','Warrior'),
('Condi','CB','Berserker','Warrior'),
('P Banner','PBSpb','Spellbreaker','Warrior'),
('Power','PSpb','Spellbreaker','Warrior'),

('Power','OP','Other','Other'),
('Condi','OC','Other','Other'),
('Heal','OH','Other','Other'),
('Boon','OB','Other','Other'),
('Mechanik','OM','Other','Other')

