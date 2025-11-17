CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'citizen', 
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE litter_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    image_path TEXT NOT NULL,             
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    description TEXT,
    count INTEGER NOT NULL,
    categories TEXT[],
    raw_detections JSONB,
    status VARCHAR(20) DEFAULT 'active',  
    verified_by TEXT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE cleanup_reports (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES litter_reports(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    image_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);




CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES litter_reports(id) ON DELETE CASCADE,
    official_name TEXT,
    action TEXT,              
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);