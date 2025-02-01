drop table if exists register;

create table register(
    user_id integer unique primary key,
    username text unique not null, 
    password text not null,
    profile_pic text
    );

drop table if exists task_data;

create table task_data(
    task_id integer unique primary key, 
    user_id integer not null, 
    title text not null, 
    task_color text, 
    status text default 'pending', 
    alert text, 
    date date not null,
    time time not null,
    foreign key (user_id) references register(user_id) on delete cascade
    );

drop table if exists contact;
    create table contact(
        username text not null,
        message text 
    );