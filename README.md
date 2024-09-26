# RRI

A quick project setup documentation for the dev environment.


## ENVIRONMENT
- Linux systems, Windows systems are all valid systems capable of running the project.
- Have Node js 16 or Later installed on the system.
- Have Postgres 13 or Later

## THE CODE

Clone the project from [rri frontend](https://github.com/cylab-africa/RRI_frontend) and [rri backend](https://github.com/cylab-africa/RRI_backend) and install dependencies 

--clone the backend and the fronend projects

```>git clone https://github.com/cylab-africa/RRI_backend.git```

```>git clone https://github.com/cylab-africa/RRI_frontend.git```

--CD the backend project

```>cd RRI_backend```

```>npm install```

```>cd ../```

--CD the frontend project

```>cd RRI_frontend```

```>npm install```

---For the frontend app you are good to go---

Configure prisma in the dev environment and connect the DB

Create a Database in Postgres and call it {test} (You can use the default user bcz this is a dev env)

USER: “postgres”
PASSWORD: “ ”

```>sudo -i -u postgres```

....

```#CREATE DATABASE test```

ADD THE .env FILE FOR PRISMA

```>cd RRI_backend/src/config```

```>touch .env```

INSIDE the file ADD

'''
DATABASE_URL="postgresql://postgres:123@localhost:5432/test"
'''

Database migration

```> cd RRI_backend```

```> npm install prisma --save-dev```

```> cd RRI_backend/scr/db/config```

```> npx prisma migrate dev --name {anyNameYouWant}```


Initialize the database by adding questions

Run the following command

```>node RRI_backend/src/utilities/addQuestions.js```


## RUN THE PROJECT

You can now run the backend and frontend apps

---Run the backend app

```>cd RRI_backend```

```>npm start```

---Run the frontend app

```>cd RRI_frontend```

```>npm start```
