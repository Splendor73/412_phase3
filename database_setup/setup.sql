BEGIN;

-- 1) Drop everything
DROP TABLE IF EXISTS
    course_skills,
    user_skills,
    skill,
    bookmark,
    course_prerequisite,
    course,
    platform,
    asu_admin,
    student,
    "user",
    institution
CASCADE;

-- 2) Core user tables
CREATE TABLE "user" (
    user_id       SERIAL     PRIMARY KEY,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    type          VARCHAR(20)  NOT NULL
                   CHECK (type IN ('student','asu_admin')),
    date_created  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 3) Student table
CREATE TABLE student (
    user_id       INTEGER     PRIMARY KEY
                   REFERENCES "user"(user_id) ON DELETE CASCADE,
    major         VARCHAR(100),
    skill_level   VARCHAR(50)
);

-- 4) ASU Admin table
CREATE TABLE asu_admin (
    user_id       INTEGER     PRIMARY KEY
                   REFERENCES "user"(user_id) ON DELETE CASCADE,
    department    VARCHAR(100),
    job_title     VARCHAR(100)
);

-- 5) Institution table
CREATE TABLE institution (
    institution_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 6) Platform & courses
CREATE TABLE platform (
    platform_id   SERIAL      PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    website       VARCHAR(255)
);

-- 7) Courses table
CREATE TABLE course (
    course_id     SERIAL       PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    difficulty    VARCHAR(50),
    platform_id   INTEGER
                   REFERENCES platform(platform_id)
                   ON DELETE SET NULL,
    institution_id INTEGER
                   REFERENCES institution(institution_id)
                   ON DELETE SET NULL,
    rating        DOUBLE PRECISION,
    url           VARCHAR(512),
    num_enrollments INT NOT NULL DEFAULT 0
);

-- 8) Relationships
CREATE TABLE course_prerequisite (
    course_id              INTEGER
                            REFERENCES course(course_id)
                            ON DELETE CASCADE,
    prerequisite_course_id INTEGER
                            REFERENCES course(course_id)
                            ON DELETE CASCADE,
    PRIMARY KEY(course_id, prerequisite_course_id)
);

-- 9) Bookmarks
CREATE TABLE bookmark (
    user_id      INTEGER
                   REFERENCES "user"(user_id)
                   ON DELETE CASCADE,
    course_id    INTEGER
                   REFERENCES course(course_id)
                   ON DELETE CASCADE,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, course_id)
);

-- 10) Skill
CREATE TABLE skill (
    skill_id     SERIAL      PRIMARY KEY,
    name         VARCHAR(100) UNIQUE NOT NULL
);

-- 11) User skills
CREATE TABLE user_skills (
    user_id      INTEGER
                   REFERENCES "user"(user_id)
                   ON DELETE CASCADE,
    skill_id     INTEGER
                   REFERENCES skill(skill_id)
                   ON DELETE CASCADE,
    PRIMARY KEY(user_id, skill_id)
);

-- 12) Course skills
CREATE TABLE course_skills (
    course_id    INTEGER
                   REFERENCES course(course_id)
                   ON DELETE CASCADE,
    skill_id     INTEGER
                   REFERENCES skill(skill_id)
                   ON DELETE CASCADE,
    PRIMARY KEY(course_id, skill_id)
);

COMMIT;