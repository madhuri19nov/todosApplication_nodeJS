const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperties = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getToDosQuery = "";
  const { search_q, priority, category, status } = request.query;
  /*console.log(hasCategoryAndStatusProperties(request.query));*/
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getToDosQuery = `
                SELECT
                  *
                FROM 
                 todo 
                WHERE status ='${status}' AND priority = '${priority}'
            `;
          data = await db.all(getToDosQuery);
          response.send(
            data.map((eachItem) => {
              return outPutResult(eachItem);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "lEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getToDosQuery = `
                SELECT
                  *
                FROM 
                 todo 
                WHERE category ='${category}' AND priority = '${priority}'
            `;
          data = await db.all(getToDosQuery);
          response.send(
            data.map((eachItem) => {
              return outPutResult(eachItem);
            })
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getToDosQuery = `
                SELECT
                  *
                FROM 
                 todo 
                WHERE priority = '${priority}'
            `;
        data = await db.all(getToDosQuery);
        response.send(
          data.map((eachItem) => {
            return outPutResult(eachItem);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperties(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getToDosQuery = `
                SELECT
                  *
                FROM 
                 todo 
                WHERE status = '${status}'
            `;
        data = await db.all(getToDosQuery);
        response.send(
          data.map((eachItem) => {
            return outPutResult(eachItem);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasSearchProperties(request.query):
      getToDosQuery = `
                SELECT
                  *
                FROM 
                 todo 
                WHERE todo LIKE "%${search_q}%"
            `;
      data = await db.all(getToDosQuery);
      response.send(
        data.map((eachItem) => {
          return outPutResult(eachItem);
        })
      );

      break;

    case hasCategoryProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "lEARNING"
      ) {
        getToDosQuery = `
                SELECT
                  *
                FROM 
                 todo 
                WHERE category ='${category}'
            `;
        data = await db.all(getToDosQuery);
        response.send(
          data.map((eachItem) => {
            return outPutResult(eachItem);
          })
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getToDosQuery = `
                SELECT  * FROM todo`;
      data = await db.all(getToDosQuery);
      response.send(
        data.map((eachItem) => {
          return outPutResult(eachItem);
        })
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoDetails = `
    SELECT 
    * 
    FROM todo WHERE id = "${todoId}"
    `;

  const dbResponse = await db.get(getToDoDetails);
  response.send(outPutResult(dbResponse));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `
      SELECT * FROM todo WHERE due_date = '${newDate}'`;

    const dbResponse = await db.all(getDateQuery);
    response.send(
      dbResponse.map((eachItem) => {
        return outPutResult(eachItem);
      })
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "lEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postNewQuery = `
          INSERT INTO todo (id, todo, priority, status, category, due_date)
          VALUES (${id}, "${todo}", "${priority}", "${status}", "${category}", "${newDueDate}")
          `;
          await db.run(postNewQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteQuery = `
    DELETE FROM todo WHERE id = "${todoId}"
  `;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const requestBody = request.body;
  let updatedColumn = "";

  const previousToDoQuery = `SELECT * FROM todo WHERE id="${todoId}"`;
  const previousToDo = await db.get(previousToDoQuery);

  const {
    todo = previousToDo.todo,
    priority = previousToDo.priority,
    status = previousToDo.status,
    category = previousToDo.category,
    dueDate = previousToDo.dueDate,
  } = request.body;

  let updateToDo;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateToDo = `
          UPDATE todo 
          SET 
                todo='${todo}', 
                status='${status}', 
                priority ='${priority}', 
                category='${category}', 
                due_date='${dueDate}'
          WHERE id = ${todoId}`;
        await db.run(updateToDo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateToDo = `
          UPDATE todo SET 
          todo='${todo}', status='${status}', priority ='${priority}', category='${category}', due_date='${dueDate}'
          WHERE id = ${todoId}`;
        await db.run(updateToDo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateToDo = `
          UPDATE todo SET 
          todo='${todo}', status='${status}', priority ='${priority}', category='${category}', due_date='${dueDate}'
          WHERE id = ${todoId}`;
      await db.run(updateToDo);
      response.send("Todo Updated");

      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "lEARNING"
      ) {
        updateToDo = `
          UPDATE todo SET 
          todo='${todo}', status='${status}', priority ='${priority}', category='${category}', due_date='${dueDate}'
          WHERE id = ${todoId}`;
        await db.run(updateToDo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateToDo = `
          UPDATE todo SET 
          todo='${todo}', status='${status}', priority ='${priority}', category='${category}', due_date='${newDueDate}'
          WHERE id = ${todoId}`;

        await db.run(updateToDo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

module.exports = app;
