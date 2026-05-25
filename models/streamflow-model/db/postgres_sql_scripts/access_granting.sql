-- 1. Разрешить использовать схему
grant usage on schema public to app_writer;

-- 2. Разрешить создавать таблицы
grant create on schema public to app_writer;

-- 3. Права на ВСЕ существующие таблицы
grant select, insert, update, delete
on all tables in schema public
to app_writer;

-- 4. Права на БУДУЩИЕ таблицы
alter default privileges in schema public
grant select, insert, update, delete
on tables
to app_writer;
