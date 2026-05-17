CREATE TABLE roles (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE permissions (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             name VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO roles (id, name) VALUES
                                 (gen_random_uuid(), 'ADMIN'),
                                 (gen_random_uuid(), 'USER');

INSERT INTO permissions (id, name) VALUES
                                       (gen_random_uuid(), 'CREATE_REQUEST'),
                                       (gen_random_uuid(), 'DELETE_USER'),
                                       (gen_random_uuid(), 'VIEW_DASHBOARD');
