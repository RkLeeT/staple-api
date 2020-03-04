const logger = require(`../../../config/winston`);
const util = require("util");

async function loadQueryData(database, queryInfo, uri, page, inferred, tree, source) {
    database.dbCallCounter = 0; // debug only
    database.drop(); // clear db before new query.

    let coreIds = [];
    let resolverName = database.schemaMapping["@revContext"][uri];
    if (resolverName === undefined) {
        return;
    }

    let coreSelectionSet = queryInfo["selectionSet"];

    for (let coreSelection in coreSelectionSet["selections"]) {
        let selectionSet = coreSelectionSet["selections"][coreSelection];
        if (resolverName == coreSelectionSet["selections"][coreSelection].name.value) {
            await database.loadCoreQueryDataFromDB(uri, page, selectionSet, inferred, tree, source);
            coreIds = await database.getSubjectsByType(uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);
            await searchForDataRecursively(database, coreSelectionSet["selections"][coreSelection]["selectionSet"], coreIds, tree, false, resolverName, undefined, source);
        }
    }

    return coreIds;
}

//@param {source} argument source
async function searchForDataRecursively(database, selectionSet, uri, tree, reverse = false, parentName = undefined, source = undefined, parentQuerySource=undefined) {
    logger.info("dataRetrievalAlgorithm: searchForDataRecursively was called");
    logger.debug(`Started function searchForDataRecursively with args:
        \tselectionSet: ${JSON.stringify(selectionSet)}
        \turi: ${util.inspect(uri, false, null, true /* enable colors */)}
        \ttree: ${tree}
        \treverse: ${reverse}
        \tQUADS : ${database.database.size}
        \tObjects : ${database.countObjects()}
        \tsource : ${source}
        `);

    let name = undefined;
    for (let selection of selectionSet["selections"]) {
        if (selection.kind === "InlineFragment") {
            await searchForDataRecursively(database, selection["selectionSet"], uri, tree, false, parentName, source);
        }
        //if there is any selection
        else if (selection["selectionSet"] !== undefined && selection.name !== undefined) {
            logger.debug("Looking for:");
            logger.debug(selection.kind);
            logger.debug(util.inspect(selection.name, false, null, true));

            name = selection.name.value;
            let newUris = new Set();
            let type = database.schemaMapping["@context"][name];

            //TODO error handling

            if (source == undefined){
                if (selection.arguments.length > 0){
                    if (selection.arguments[0].value.values !== undefined) {
                        source = selection.arguments[0].value.values[0].value;
                    } else {
                        source = selection.arguments[0].value.value;
                    }
                }else{
                    source = parentQuerySource
                }
                //if there s no arguments for selection set then source should be the same as parent query source
                //else if there is an argument source, then source should be switched for argument
            }

            //gets data for already existing 
            for (let id of uri) {
                let data = [];

                data = await database.getObjectsValueArray(id, type);
                logger.debug("Asked for ID TYPE");
                logger.debug(util.inspect(id, false, null, true));
                logger.debug(util.inspect(type, false, null, true));

                for (let x of data) {
                    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                    if (pattern.test(x)) {
                        newUris.add(x);
                    }
                }
            }

            newUris = [...newUris];

            if (newUris.length > 0) {
                await database.loadChildObjectsByUris(newUris, selection, tree, parentName, /*source needs to be specified here or it will use default*/source);

                let newParentName = tree[parentName].data[name];
                if (newParentName === undefined) {
                    newParentName = {};
                }
                newParentName = newParentName.name;

                await searchForDataRecursively(database, selection["selectionSet"], newUris, tree, false, newParentName, source);
            }

        }
        else {
            logger.debug("Skiped object from query");
            logger.debug(selection.kind);
            logger.debug(util.inspect(selection.name, false, null, true));
        }
    }
}


module.exports = {
    loadQueryData,
    searchForDataRecursively,
};