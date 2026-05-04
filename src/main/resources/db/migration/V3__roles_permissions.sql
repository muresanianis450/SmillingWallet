INSERT INTO roles (id, name) VALUES
                                 (gen_random_uuid(), 'ADMIN'),
                                 (gen_random_uuid(), 'USER');

INSERT INTO permissions (id, name) VALUES
                                       (gen_random_uuid(), 'CREATE_REQUEST'),
                                       (gen_random_uuid(), 'DELETE_USER'),
                                       (gen_random_uuid(), 'VIEW_DASHBOARD');
