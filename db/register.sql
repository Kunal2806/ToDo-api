drop table if exists register;

create table register(username Varchar(20) unique not null, password text not null);