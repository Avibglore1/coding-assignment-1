const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
var isValid = require('date-fns/isValid')

app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000/`)
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.category.search_q !== undefined
}

convertDataIntoResponseObj = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

//API 1
app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status, category} = request.query

  let data = null
  let getTodosQuery = ''

  switch (true) {
    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `
            SELECT * 
            FROM todo 
            WHERE status = '${status}';`

        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertDataIntoResponseObj(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE priority = '${priority}';`

        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertDataIntoResponseObj(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                    SELECT * 
                    FROM todo
                    WHERE priority = '${priority}' AND status = '${status}';`

          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertDataIntoResponseObj(eachItem)),
          )
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasSearchProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE '%${search_q}%';`

      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => convertDataIntoResponseObj(eachItem)))

      break

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                SELECT * 
                FROM todo
                WHERE category = '${category}' 
                    AND status = '${status}';`

          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertDataIntoResponseObj(eachItem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break
    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `
            SELECT * 
            FROM todo
            WHERE category = '${category}';`

        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertDataIntoResponseObj(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Inavalid Todo Category')
      }

      break

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `
                SELECT * 
                FROM todo
                WHERE category = '${category}'
                    AND priority = '${priority}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertDataIntoResponseObj(eachItem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `
        SELECT * 
        FROM todo;`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => convertDataIntoResponseObj(eachItem)))
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = `SELECT * FROM todo
        WHERE id = ${todoId};`
  const dbResponse = await db.get(getTodosQuery)
  response.send(convertDataIntoResponseObj(dbResponse))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {data} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const getDateQuery = `SELECT * FROM todo
            WHERE due_date = '${newDate}';`
    const dbResponse = await db.all(getDateQuery)

    response.send(
      dbResponse.map(eachItem => convertDataIntoResponseObj(eachItem)),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body

  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postQuery = `
                        INSERT INTO 
                        todo(id, todo, priority, status, category, due_date)
                        VALUES (
                            ${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDueDate}');`
          await db.run(postQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body

  const previousToDoQuery = `
        SELECT * 
        FROM todo
        WHERE id = ${todoId};`

  const previousToDo = await db.get(previousToDoQuery)

  const {
    todo = previousToDo.todo,
    priority = previousToDo.priority,
    status = previousToDo.status,
    category = previousToDo.category,
    dueDate = previousToDo.dueDate,
  } = request.body

  let updateToDo
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateToDo = `
        UPDATE todo
        SET todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}',
        WHERE id = ${todoId};`
        await db.run(updateTodo)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodo = `
        UPDATE todo
        SET todo = '${todo}',
          priority = '${priority}',
          status = '${status}',
          category = '${category}',
          due_date = '${dueDate}';`
        await db.run(updateTodo)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    case requestBody.todo !== undefined:
      updateTodo = `
      UPDATE Todo
      SET todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}'
        WHERE id = ${todoId};`
      await db.run(updateTodo)
      response.send('Todo Update')

      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateToDo = `
        UPDATE todo
        SET todo = '${todo}',
          priority = '${priority}',
          status = '${status}',
          category = '${category}',
          due_date = '${dueDate}'
        WHERE id = ${todoId};`

        await db.run(updateToDo)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDate = format(new Date(dueDate), 'yyyy-MM-dd')

        updateToDo = `
          UPDATE todo
          SET todo = '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${dueDate}'
          WHERE id = ${todoId};`

        await db.run(updateToDo)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteToDoQuery = `
    DELETE FROM
    todo
    WHERE id = ${todoId};`
  await db.run(deleteToDoQuery)
  response.send('Todo Deleted')
})

module.exports = app
