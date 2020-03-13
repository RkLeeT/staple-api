const express = require("express");
const bodyParser = require("body-parser");
const uuidv1 = require("uuid/v1");
const { ApolloServer } = require("apollo-server-express");
const logger = require("./config/winston");
const staple = require("staple-api");

const app = express();

const Warnings = []; // Warnings can be added as object to this array. Array is clear after each query.

app.use(bodyParser.json({ limit: "4000mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "4000mb", extended: true }));

// Cors
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    next();
});

app.listen({ port: 4000 }, () =>
    console.log("🚀 Server ready")
);

// show memory usage every 5 seconds
setInterval(function () {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
    if (used > 100) {
        console.log("need to clear!");
    }
    return Math.round(used * 100) / 100;
}, 5000);

async function init(app, index) {
    let stapleApi = await staple({file: "./ontology.ttl"}, {dataSources: {default: "memory",  memory: {type: "memory"}}});
    let schema = stapleApi.schema;
    let database = stapleApi.database;
    let exampleObjects = require("./database/exampleObjects");

    for (let obj of exampleObjects) {
        await database.pushObjectToBackend(obj)
    }    
    const path = "/graphql/" + index;
    process.env.GRAPHQL_BASIC_ENDPOINT = "http://localhost:4000" + path;
    let server = new ApolloServer({
        schema,
        // playground: {
        //     endpoint: path,
        //     tabs: require("./tabs")
        // },
        formatResponse: response => {
            if (response.errors !== undefined) {
                response.data = false;
            }
            else {
                if (response.data !== null && Warnings.length > 0) {
                    response["extensions"] = {};
                    response["extensions"]["Warning"] = [...Warnings];
                    Warnings.length = 0;
                }
            }
            return response;
        },
        context: () => {
            return {
                myID: index,
            };
        }

    });

    server.applyMiddleware({ app, path });

}

async function customInit(app, index, req) {
    let newEndpointData = await staple(String(req.body.value), {dataSources: {default: "memory",  memory: {type: "memory"}}});
    let schema = newEndpointData.schema;

    if (newEndpointData["Error"]) {
        return newEndpointData;
    }    
    let server = new ApolloServer({
        schema,
        formatResponse: response => {
            if (response.errors !== undefined) {
                response.data = false;
            }
            else {
                if (response.data !== null && Warnings.length > 0) {
                    response["extensions"] = {};
                    response["extensions"]["Warning"] = [...Warnings];
                    Warnings.length = 0;
                }
            }
            return response;
        },
        context: () => {
            return {
                myID: index,
            };
        },
    });

    const path = "/graphql/" + index;
    server.applyMiddleware({ app, path });
    // console.log(newEndpointData.context)
    return newEndpointData.schemaMapping["@context"];
}

app.get("/api/dynamic", function (req, res) {
    let id = uuidv1();
    const tabs = [{endpoint: "http://localhost:4000/graphql/${id}", query: `{
        Organization {
          _id
          _type
          name
          employee {
            _id
            _type
            name
            customerOf {
              _id
            }
          }
        }
      }`}]
    init(app, id);
    res.send({id:id, tabs: tabs});
    logger.warn(`Endpoint created ! http://localhost:4000/graphql/${id}`);
});
    

app.post("/api/customInit", async function (req, res) {
    let id = uuidv1();
    let context = await customInit(app, id, req);
    if (context["Error"]) {
        res.status(500).send(context["Error"]);
        logger.warn(`ERROR! Endpoint was not created ! ${context["Error"]} \n${req.body.value}`);
    }
    else {
        res.send({ "id": id, "context": context });
        logger.warn(`Endpoint created ! http://localhost:4000/graphql/${id}`);
    }

});

module.exports = {
    app,
};
