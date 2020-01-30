


let handleClassTypeResolver = (tree, object, database, schemaMapping) => {
    let newResolverBody = {};

    for (var propertyName in tree[object].data) {
        let currentObject = tree[object].data[propertyName];
        let isItList = false;

        if (currentObject.kind == "ListType") {
            currentObject = currentObject.data;
            isItList = true;
        }

        if (propertyName === "_id") {
            newResolverBody["_id"] = (parent) => { return parent; };
        }
        else if (propertyName === "_type") {
            newResolverBody["_type"] = async (parent, args) => {
                if (args.inferred) {
                    return await database.getObjectsValueArray((parent), database.stampleDataType);
                }
                let types = await database.getObjectsValueArray((parent), ("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"));

                types = types.map(x => {
                    for (let key in schemaMapping["@context"]) {
                        if (schemaMapping["@context"][key] === x)
                            return key;
                    }
                    return "";
                });

                return types;
            };
        }
        else {
            let uri = schemaMapping["@context"][propertyName];
            if (uri === undefined) {
                // throw new GraphQLError({ key: `Uri not found`, message: 'URI for: {propertyName} was not found' });
                uri = "http://schema.org/" + propertyName;
            }

            if (tree[currentObject.name].type === "UnionType") {
                const name = uri;
                let constr = (name) => {
                    return async (parent) => {
                        let data = await database.getObjectsValueArray((parent), (name));
                        return data;
                    };
                };
                newResolverBody[propertyName] = constr(name);

            }
            else {
                const name = uri;
                let type = currentObject.name;

                let constr = (name, isItList, type, objectType) => {
                    return (async (parent, args) => {
                        if (name === "@reverse") {
                            let data = database.getTriplesByObjectUri(parent);
                            return data;
                        }

                        if (parent.value) {
                            parent = parent.value;
                        }

                        if (isItList) {
                            if (objectType === "http://schema.org/DataType") {
                                let data = await database.getObjectsValueArray((parent), (name), true);
                                return data;
                            }
                            else {
                                let data = await getFilteredObjectsUri(database, parent, name, args);


                                return data;
                            }
                        }
                        else {
                            return database.getSingleLiteral((parent), (name));
                        }
                    });
                };
                newResolverBody[propertyName] = constr(name, isItList, type, tree[currentObject.name].type);
            }
        }
    }
    return newResolverBody;
};



let getFilteredObjectsUri = async (database, parent, name, args) => {
    let tempData = await database.getObjectsValueArray((parent), (name), false);
    // add ignoring bad filter fields !! ( from tree )
    
    let data = [];
    if (args.filter !== undefined ){
        for(let prop in args.filter){
            if(prop === "_id"){
                for (let uri of tempData) {
                    if (args.filter["_id"].includes(uri)) {
                        data.push(uri);
                    }
                }
            }
        }
    }
    else {
        data = tempData;
    }
    // console.log(data);
    
    return data;
};

module.exports = handleClassTypeResolver;