drop table if exists register;

create table register(
    user_id integer unique primary key autoincrement,
    username text unique not null, 
    password text not null,
    profile_pic text
    );

drop table if exists task_data;

create table task_data(
    task_id integer unique primary key autoincrement, 
    user_id integer not null, 
    title text not null, 
    task_color text, 
    status text default 'pending', 
    alert text, 
    duedate timestamp not null, 
    foreign key (user_id) references register(user_id) on delete cascade
    );