## Introduction

**Staple API** is a lightweight GraphQL-based API enabling easy management of **semantic knowledge graphs**, virtualized as linked data and structured by an RDF ontology. The two driving principles behind the design of the API are:
1. The core GraphQL service with its schema and resolvers is **induced fully automatically from a simple RDF ontology** and is coupled with a selected backend (currently only MongoDB or an in-memory graph databse). This makes configuring and starting the API possible in mere minutes. 
2. All CRUD operations are done entirely via **the standard GraphQL interface and based exlusively on JSON** objects. This makes data management simple and intuitive for majority of developers. The semantic knowledge graph is an abstraction of the data and is virtulized as linked data via the optional JSON-LD JSON-to-graph mapping mechanism. 

<br> 

<p align="center">
  <img src="staple-api-architecture2.png">
</p>

## Ontology and schema

Staple API schema is generated automatically from an RDF ontology expressed in an extension of the [schema.org data model](https://schema.org/docs/datamodel.html). This data model is based on the following vocabularies:

```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
```

and includes the following vocabulary elements:


<!-- tabs:start -->

#### **RDF ontology**

| Construct                     | RDF construct / functionality               |
| ----------------------------- | ------------------------------------------- |
| `rdfs:Class`                  | A class                                     |
| `rdfs:subClassOf`             | A subclass of another class                 |
| `rdf:Property`                | A property                                  |                
| `owl:FunctionalProperty`      | A functional property (accepts at most one value)   |                   
| `rdfs:comment`                | A description of a vocabulary element       |
| `schema:domainIncludes`       | An allowed domain type of a property        |
| `schema:rangeIncludes`        | An allowed range type of a property         |
| `xsd:string`                  | The (xsd) `string` datatype                 |
| `xsd:integer`                 | The (xsd) `integer` datatype                |
| `xsd:decimal`                 | The (xsd) `decimal` datatype                |
| `xsd:boolean`                 | The (xsd) `boolean` datatype                |

#### **GraphQL schema**


| Construct                     | GraphQL functionality / construct           |
| ----------------------------- | ------------------------------------------- |
| `rdfs:Class`                  | A type                                      |
| `rdfs:subClassOf`             | Implicit type inheritance/inference         |
| `rdf:Property`                | A field                                     |                
| `owl:FunctionalProperty`      | A single-valued field                       |                   
| `rdfs:comment`                | A description of a type or field            |
| `schema:domainIncludes`       | A type on which the field occurs   |
| `schema:rangeIncludes`        | The value type of the field                 |
| `xsd:string`                  | `String` scalar type                        |
| `xsd:integer`                 | `Int` scalar type                           |
| `xsd:decimal`                 | `Float` scalar type                         |
| `xsd:boolean`                 | `Bool` scalar type                          |
<!-- tabs:end -->

## RDF ontology

Currently the ontologies accepted by Staple API must be defined in the [RDF Turtle sytnax](https://www.w3.org/TR/turtle/). The following example presents a simple ontology including all supported constructs:


```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix example: <http://example.com#> .

# classes (-> GraphQL types )

example:Agent a rdfs:Class ;
    rdfs:comment "An agent (individual or legal)" .

example:Organization a rdfs:Class ;
    rdfs:comment "An organization such as a school, NGO, corporation, club, etc." ;
    rdfs:subClassOf example:Agent .

example:Person a rdfs:Class ;
    rdfs:comment "A person" ;
    rdfs:subClassOf example:Agent .

# properties ( -> GraphQL fields )

example:name a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Name of the agent" ;
    schema:domainIncludes example:Agent ;
    schema:rangeIncludes xsd:string .

example:age a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Age of the person" ;
    schema:domainIncludes example:Person ;
    schema:rangeIncludes xsd:integer .

example:isMarried a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "This person is married" ;
    schema:domainIncludes example:Person ;
    schema:rangeIncludes xsd:boolean .

example:revenue a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "The annual revenue of the organization" ;
    schema:domainIncludes example:Organization ;
    schema:rangeIncludes xsd:decimal .

example:employee a rdf:Property ;
    rdfs:comment "An employee of an organization" ;
    schema:domainIncludes example:Organization ;
    schema:rangeIncludes example:Person .

example:customerOf a rdf:Property ;
    rdfs:comment "An organization this agent is a customer of" ;
    schema:domainIncludes example:Agent ;
    schema:rangeIncludes example:Organization .
```

In the following points we summarize and further explain specific elements and patterns used in RDF ontologies, using the above one as a running example.

### Prefix declarations

Prefix declarations, placed in the beginning of the ontology, define mappings from the shortcut prefixes for specific vocabularies to the full URI namespaces they denote, e.g.:

```turtle
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix example: <http://example.com#> .
```



### Class definitions

A class definition specifies the name of the class, its description and its direct superclasses, e.g.:

```turtle
example:Person a rdfs:Class ;
    rdfs:comment "A person" ;
    rdfs:subClassOf example:Agent .
```
This definition describes the class `example:Person` as "*A person*" and as a subclass of `example:Agent`. This means that every instance of `example:Person` is indirectly an instance of `example:Agent`. 

!> Note that each class can have zero or more direct superclasses.


### Property definitions

A property definition specifies the name of a property, its description, the classes of objects to which it applies, and the type of values it accepts, e.g.:

```turtle
example:name a rdf:Property, owl:FunctionalProperty ;
    rdfs:comment "Name of the agent" ;
    schema:domainIncludes example:Agent ;
    schema:rangeIncludes xsd:string .
```

This definition describes the property `example:name` as "*Name of the agent*". It is declared to be a functional property, meaning that an instance can have at most one value of this property (i.e., one `example:name`). The domain of `example:name` includes `example:Agent`, which means that it applies only to (direct and indirect) instances of `example:Agent` (i.e., including instances of `example:Person` and `example:Organization`). The values of `example:name` must be of type `xsd:string`. 

```turtle
example:employee a rdf:Property ;
    rdfs:comment "An employee of an organization" ;
    schema:domainIncludes example:Organization ;
    schema:rangeIncludes example:Person .
```
This definition describes the property `example:employee` as "*An employee of an organization*". The domain of `example:employee` includes `example:Organization`, which means that it applies only to (direct and indirect) instances of `example:Organization`. The (zero or more) values of `example:employee` must be of type `example:Person`. 

!> Note that each property must have at least one `schema:domainIncludes` value and (currently) exactly one `schema:rangeIncludes` value.
    
### Ontology URIs 

?> A valid URI consists of two parts: **namespace** + **local name**. The namespace of a URI is its initial substring *up to and including* the last symbol `/` or `#`. The local name is the remainder of the string, *after* the last symbol `/` or `#`. For instance, the URI `http://example.com/Name` consists of the namespace `http://example.com/` and the local name `Name`. 

The URIs of classes and properties in the ontology are acceptable by Staple API provided that their local names meet two conditions:
1. are unique across the ontology (e.g., there is no two URIs such as `http://example-domain-1.com/Name` and `http://example-domain-2.com/Name`)

?> Positive example: 
<br> :heavy_check_mark: `http://example.com/Name1` 
<br> :heavy_check_mark: `http://example.com/Name2` 
<br> :heavy_check_mark: `http://example.com#Name1` 
<br> :heavy_check_mark: `http://example.com#Name2`
<br><br> 
Negative example: 
<br> :x: `http://example-domain-1.com/Name` 
<br> :x: `http://example-domain-2.com/Name`

2. are valid GraphQL schema names (matching the regex: `/[_A-Za-z][_0-9A-Za-z]*/`).

?> Positive examples: 
<br> :heavy_check_mark: `http://example.com/Name` 
<br> :heavy_check_mark: `http://example.com/Name123` 
<br> :heavy_check_mark: `http://example.com#_123` 
<br> :heavy_check_mark: `http://example.com#_name`
<br><br> 
Negative examples: 
<br> :x: `http://example.com/name-with-dash` 
<br> :x: `http://example.com#123nameStartingWithDigit`


## GraphQL schema 

The RDF ontology is automatically mapped to the corresponding GraphQL schema. For instance, the ontology above corresponds to the following schema represented in the [Schema Definition Language](https://alligator.io/graphql/graphql-sdl/):


<!-- tabs:start -->

#### **GraphQL schema example (without descriptions)**
```graphql

type Agent {
  name: String
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}

type Organization {
  name: String
  employee: [Person]
  revenue: Float
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}

type Person {
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}

type _CONTEXT {
  _id: String
  _type: String
  Agent: String
  Organization: String
  Person: String
  name: String
  age: String
  revenue: String
  isMarried: String
  employee: String
  customerOf: String
}

type Query {
  _CONTEXT: _CONTEXT
 
  Agent(
    page: Int
    filter: Agent_FILTER
    inferred: Boolean = false
  ): [Agent]

  Organization(
    page: Int
    filter: Organization_FILTER
    inferred: Boolean = false
  ): [Organization]

  Person(
    page: Int
    filter: Person_FILTER
    inferred: Boolean = false
  ): [Person]
}

input Agent_FILTER {
  _id: [ID]
  name: [String]
  customerOf: [ID]
}

input Organization_FILTER {
  _id: [ID]
  name: [String]
  employee: [ID]
  revenue: [Float]
  customerOf: [ID]
}

input Person_FILTER {
  _id: [ID]
  name: [String]
  age: [Int]
  isMarried: [Boolean]
  customerOf: [ID]
}

type Mutation {
  DELETE(
    _id: ID
  ): Boolean

  Agent(
    type: MutationType = PUT
    input: Agent_INPUT!
  ): Boolean

  Organization(
    type: MutationType = PUT
    input: Organization_INPUT!
  ): Boolean

  Person(
    type: MutationType = PUT
    input: Person_INPUT!
  ): Boolean
}

input Agent_INPUT {
    _id: ID!
    name: String
  customerOf: [ID]
}

input Organization_INPUT {
  _id: ID!
  name: String
  employee: [ID]
  revenue: Float
  customerOf: [ID]
}

input Person_INPUT {
  _id: ID!
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [ID]
}

enum MutationType {
  PUT
}

```
#### **GraphQL schema example (with descriptions)**

```graphql
"""An agent"""
type Agent {
  """Name of the agent"""
  name: String
  """An organization this agent is a customer of"""
  customerOf: [Organization]
  """The unique identifier of the object"""
  _id: ID!
  """Types of the object."""
  _type(
    """Include inferred types for this object"""
    inferred: Boolean = false
  ): [String]
}

"""
An organization such as a school, NGO, corporation, club, etc.
Broader types: Agent
"""
type Organization {
"""Name of the agent"""
  name: String
  """An employee of an organization"""
  employee: [Person]
  """The annual revenue of the organization"""
  revenue: Float
  """An organization this agent is a customer of"""
  customerOf: [Organization]
  """The unique identifier of the object"""
  _id: ID!
  """Types of the object"""
  _type(
    """Include inferred types for this object"""
    inferred: Boolean = false
  ): [String]
}

"""
A person
Broader types: Agent
"""
type Person {
  """Name of the agent"""
  name: String
  """Age of the person"""
  age: Int
  """The person is married"""
  isMarried: Boolean
  """An organization this agent is a customer of"""
  customerOf: [Organization]
  """The unique identifier of the object"""
  _id: ID!
  """Types of the object"""
  _type(
    """Include inferred types for this object"""
    inferred: Boolean = false
  ): [String]
}

"""
The mapping from types and properties of the GraphQL schema to the corresponding URIs of the structured data schema.
"""
type _CONTEXT {
  """@id"""
  _id: String
  """@type"""
  _type: String
  """http://example.com/Agent"""
  Agent: String
  """http://example.com/Organization"""
  Organization: String
  """http://example.com/Person"""
  Person: String
  """http://example.com/name"""
  name: String
  """http://example.com/age"""
  age: String
  """http://example.com/revenue"""
  revenue: String
  """http://example.com/isMarried"""
  isMarried: String
  """http://example.com/employee"""
  employee: String
  """http://example.com/customerOf"""
  customerOf: String
}

"""Get objects of specific types"""
type Query {
  """
  Get elements of the _CONTEXT object
  """
  _CONTEXT: _CONTEXT
 
  """Get objects of type: Agent"""
  Agent(
    """
    The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
    """
    page: Int
    """Filters the selected results based on specified field values"""
    filter: Agent_FILTER
    """Include indirect instances of this type"""
    inferred: Boolean = false
  ): [Agent]


  """Get objects of type: Organization"""
  Organization(
    """
    The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
    """
    page: Int
    """Filters the selected results based on specified field values"""
    filter: Organization_FILTER
    """Include indirect instances of this type"""
    inferred: Boolean = false
  ): [Organization]


  """Get objects of type: Person"""
  Person(
    """
    The number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
    """
    page: Int
    """Filters the selected results based on specified field values"""
    filter: Person_FILTER
    """Include indirect instances of this type"""
    inferred: Boolean = false
  ): [Person]
}

"""Filter on type: Agent"""
input Agent_FILTER {
  """Possible identifiers"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""Filter on type: Organization"""
input Organization_FILTER {
  """Possible identifiers"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: employee"""
  employee: [ID]
  """Possible values on field: revenue"""
  revenue: [Float]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""Filter on type: Person"""
input Person_FILTER {
  """Possible identifiers"""
  _id: [ID]
  """Possible values on field: name"""
  name: [String]
  """Possible values on field: age"""
  age: [Int]
  """Possible values on field: isMarried"""
  isMarried: [Boolean]
  """Possible values on field: customerOf"""
  customerOf: [ID]
}

"""CRUD operations over objects of specific types"""
type Mutation {
  """Delete an object"""
  DELETE(
    """An id of the object to be deleted"""
    _id: ID
  ): Boolean

  """Perform mutation over an object of type: Agent"""
  Agent(
    """The type of the mutation to be applied"""
    type: MutationType = PUT
    """The input object of the mutation"""
    input: Agent_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Organization"""
  Organization(
    """The type of the mutation to be applied"""
    type: MutationType = PUT
    """The input object of the mutation"""
    input: Organization_INPUT!
  ): Boolean

  """Perform mutation over an object of type: Person"""
  Person(
    """The type of the mutation to be applied"""
    type: MutationType = PUT
    """The input object of the mutation"""
    input: Person_INPUT!
  ): Boolean
}

"""Input object of type: Agent"""
input Agent_INPUT {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

"""Input object of type: Organization"""
input Organization_INPUT {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """An employee of an organization"""
  employee: [ID]
  """The annual revenue of the organization"""
  revenue: Float
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

"""Input object of type Person"""
input Person_INPUT {
  """The unique identifier of the object"""
  _id: ID!
  """Name of the agent"""
  name: String
  """Age of the person"""
  age: Int
  """This person is married"""
  isMarried: Boolean
  """An organization this agent is a customer of"""
  customerOf: [ID]
}

enum MutationType {
  """
  Put the item into the database. If already exists - overwrite it. 
  """
  PUT
}
```

<!-- tabs:end -->
 
 
The specific mappings and resulting GraphQL schema patterns are further described and explained below.

### Object types

Every class (e.g., `example:Person`) is mapped to a GraphQL type called by the local name of the URI (i.e., `Person`). Its fields corrspond to properties with the compatible domain types (see below) and two special ones: 
* `_id` - holding the URI of each instance;
* `_type` - holding the (direct or inferred) types of each instance;


```graphql
type Person {
    _id: ID!
    _type(
        inferred: Boolean = false
      ): [String]
    ...
}
```

Each object type is further associated with a unique query (e.g., `Person`), a query filter (e.g., `Person_FILTER`), a mutation (e.g., `Person`), an input type (e.g., `Person_INPUT`) - all described separately below. 

### Fields

Every property (e.g., `example:name`, `example:employee`) is mapped to a field called by the local name of the URI (e.g., `name`, `employee`). The fields are added on all compatible types: 

1. those corresponding to classes declared via `schema:domainIncludes` predicate in the ontology (e.g.: `Agent` for `name`)

2. the inherited ones, which can be reached via a chain of `rdfs:subClassOf` steps in the ontology (e.g.: `Person` and `Organization` for `name`)

The type of values allowed on specific fields is determined by two components:
1. the `schema:rangeIncludes` declarations (e.g., `String` on `name` or `Organization` on `customerOf`)
2. by the `owl:FunctionalProperty` declarations on the properties: 
    * single values `field: Type` when such declaration is present (e.g., `name: String`)
    * multiple values `field: [Type]` when such declaration is missing (e.g., `customerOf: [Organization]`)

For example:

<!-- tabs:start -->

#### **Ontology**

```turtle
example:Person rdfs:subClassOf example:Agent .

example:name a rdf:Property, owl:FunctionalProperty ;
    schema:domainIncludes example:Agent ; 
    schema:rangeIncludes xsd:string . 

example:isMarried a rdf:Property, owl:FunctionalProperty ; 
    schema:domainIncludes example:Person ;
    schema:rangeIncludes xsd:boolean .

example:customerOf a rdf:Property ;
    schema:domainIncludes example:Agent ;
    schema:rangeIncludes example:Organization .
```


#### **GraphQL**

```graphql
type Person {
    ...
    name: String
    isMarried: Boolean
    customerOf: [Organization]
    ...
}
```

<!-- tabs:end -->


### Queries and mutations


Each object type is associated with a unique query (e.g., `Person`), a query filter (e.g., `Person_FILTER`), a mutation (e.g., `Person`), an input type (e.g., `Person_INPUT`). All of them are based on the same structural templates applied across all the types:


<!-- tabs:start -->

#### **type**

```graphql
type Type {
  field1: Type1
  field2: [Type2]
  ...
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}
```

#### **query**

```graphql
type Query { 
  
  Type(
    page: Int
    filter: Type_FILTER
    inferred: Boolean = false
  ): [Type]
  
}
```

#### **filter**

```graphql
input Type_FILTER {
  _id: [ID]
  field1: [Type1]
  field2: [Type2]
  ...
}
```


#### **mutation**

```graphql
type Mutation {

  Type(
    type: MutationType = PUT
    input: Type_INPUT!
  ): Boolean

}
```

#### **input**

```graphql
input Type_INPUT {
  _id: ID!
  field1: Type1
  field2: [Type2]
  ...
}
```

<!-- tabs:end -->


For instance:


<!-- tabs:start -->

#### **type Person**

```graphql
type Person {
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [Organization]
  _id: ID!
  _type(
    inferred: Boolean = false
  ): [String]
}
```

#### **query Person**

```graphql
type Query { 
  
  Person(
    page: Int
    filter: Person_FILTER
    inferred: Boolean = false
  ): [Person]
  
}
```

#### **input Person_FILTER**

```graphql
input Person_FILTER {
  _id: [ID]
  name: [String]
  age: [Int]
  isMarried: [Boolean]
  customerOf: [ID]
}
```


#### **mutation Person**

```graphql
type Mutation {

  Person(
    type: MutationType = PUT
    input: Person_INPUT!
  ): Boolean

}
```

#### **input Person_INPUT**

```graphql
input Person_INPUT {
  _id: ID!
  name: String
  age: Int
  isMarried: Boolean
  customerOf: [ID]
}
```

<!-- tabs:end -->


#### Queries and filters

An object query returns instances of the type with the same name (e.g., query `Person` returns instances of type `Person`). It supports three arguments:
- `page: Int`: specifies the number of results page to be returned by the query. A page consists of 10 results. If no page argument is provided all matching results are returned. 
- `filter: Type_FILTER`: filters the results based on lists of acceptable values specified for each field
- `inferred: Boolean = false`: specifies whether the indirect instances of this type should also be included in the results

For instance, the following query returns the first page of instances of type `Person`, whose names are "John Smith" and who are customers of either `http://example.com/org1` or `http://example.com/org2`:

```graphql
{
  Person(
    page: 1, 
    filter: {
      name: ["John Smith"], 
      customerOf: ["http://example.com/org1", "http://example.com/org2"]
    })  {
          _id
          _type 
          name
          customerOf
        }
}
```

!> All queries return instances of the type synonymous with those queries. 

#### Mutations and inputs

An object mutation enables creation and updates of instances of the type with the same name (e.g., mutation `Person` creates/updates instances of type `Person`). It supports two arguments:
- `type: MutationType = PUT`: defines the type of mutation to be performed. THe default and currently the only acceptable mutation type is PUT, which either creates a new object with a given identifer or overwrites an existing one. 
- `input: Type_INPUT!`: specifies the object of a given type to be inserted into the database. 

The input object includes the exact same fields as the associated object type, except for `_type` which is inserted automatically using the associated type as the default value. For instance, the following mutation generates an instance of `Person` with the specified attributes, which can be retrived back with the approporiate `Person` query:


<!-- tabs:start -->

#### **mutation**

```graphql
mutation Person {
  input: {
  _id: "http://example.com/john"
  name: "John Smith"
  age: "35"
  isMarried: true
  customerOf: ["http://example.com/org1", "http://example.com/org2"]
}
```

#### **query**

```graphql
{
  Person(
    filter: {
      _id_: ["http://example.com/john"]
    })  {
          _id
          _type (inferred: true)
          name
          age
          isMarried
          customerOf {
            _id
          }
        }
}
```

#### **response**

```javascript
{
  "data": {
    "Person": [
      {
        "_id": "http://example.com/john",
        "_type": [
          "Person",
          "Agent"
        ],
        "name": "John Smith",
        "age": 35,
        "isMarried": true,
        "customerOf": [
          {
            "_id": "http://example.com/org1" 
          },
          {
            "_id": "http://example.com/org2"
          }
        ]
      }
    ]
  }
}
```

<!-- tabs:end -->



Finally, GraphQL exposes also a unique `DELETE` mutation which deletes an object by its identifier specified in the `_id` argument:

```graphql
type Mutation {
  
  DELETE(
    _id: ID
  ): Boolean

}
```

For instance:

```graphql
mutation DELETE (id: "http://example.com/john")
```

!> All mutations return `true` whenever they succeed and `false` otherwise. 




### _CONTEXT


All type and property URIs used in the ontology and the additional special fields included in the GraphQL schema are automatically mapped to a basic [JSON-LD context](https://json-ld.org/spec/latest/json-ld/#the-context) of the following structure:

```javascript
{
      "_id": "@id",
      "_type": "@type",
      "Agent": "http://example.com/Agent",
      "Organization": "http://example.com/Organization",
      "Person": "http://example.com/Person",
      "name": "http://example.com/name",
      "age": "http://example.com/age",
      "revenue": "http://example.com/revenue",
      "isMarried": "http://example.com/isMarried",
      "employee": "http://example.com/employee",
      "customerOf": "http://example.com/customerOf"
}
```
This context is served via a dedicated `_CONTEXT` query in the Staple API schema and can be used to interepret every Staple API query response and input objects as valid JSON-LD objects (see [data](./data) section)





This query field returns a unique `_CONTEXT` object, which represents the expanded JSON-LD context that is assumed in the Staple API instance:

This corresponds directly to the associated JSON-LD context:

```javascript
"@context": {
    "_id": "@id",
    "_value": "@value",
    "_type": "@type",
    "_reverse": "@reverse",
    "Thing": "http://schema.org/Thing",
    "Person": "http://schema.org/Person",
    "Place": "http://schema.org/Place",
    "Text": "http://schema.org/Text",
    "name": "http://schema.org/name",
    "birthPlace": "http://schema.org/birthPlace",
    "parent": "http://schema.org/parent",
    "children": "http://schema.org/children"
}
```


```graphql
{
  _CONTEXT {
    _id
    _type
    Person
    name
    birthPlace
  }
}
```

```javascript
{
  "data": {
    "_CONTEXT": {
      "_id": "@id",
      "_type": "@type",
      "Person": "http://schema.org/Person",
      "name": "http://schema.org/name",
      "birthPlace": "http://schema.org/birthPlace"
    }
  }
}
```




## Inheritance / inference

The type inference mechanism enables to query and validate objects by their implicit (indirect) types, i.e., those that are only inferred from the type hierarchy in the ontology but not explicitly asserted on the input. 

For instance, a sample ontology in the [example above](./schema) states that `schema:Person rdfs:subClassOf schema:Thing`, i.e., that `Person` is a more specific class than `Thing`, or conversely that `Thing` is a broader class than `Person`. There are several logical consequences of that statement:

1. type `Person` inherits all properties of type `Thing`, meaning that properties of `Thing` are also permitted on objects of type `Person` (but not neccesarily the other way around);
2. every object that is of type `Person` is also of type `Thing` (but not neccesarily the other way around);
3. every object that is of type `Person` is a valid filler for any property that requires its values to be of type `Thing` (but not the other way around).

To find all (indirect / inferred) instances of a certain type you can use the `inferred: true` argument on the respective query. Compare for instance:

---
Without inference:

```graphql
{
  Thing {
    _id
  }
}
```

```graphql
{
  "data": {
    "Thing": [
    ]
  }
}
```


---
With inference:

```graphql
{
  Thing(inferred:true) {
    _id
  }
}
```

```javascript
{
  "data": {
    "Thing": [
      {
        "_id": "http://example.com/elisabeth"
      },
      {
        "_id": "http://example.com/charles"
      },
      {
        "_id": "http://example.com/william"
      },
      {
        "_id": "http://example.com/uk"
      }
    ]
  }
}
```


## Data

The Staple API is intended for managing structured data, i.e., linked data expressed within the [schema.org data model](https://schema.org/docs/datamodel.html). The shape and structure of data objects is sanctioned by the GrapHQL schema, which in turn, reflects the constraints of the ontology model.

For instance, the following objects are valid json data samples compatible with the ontology and schema example described in the [ontology and schema](./schema) section:


```javascript
{
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

```javascript
{
  "_id": "http://example.com/charles",
  "_type": "Person",
  "name": {
      "_value": "Prince Charles",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/william"
    }
  ]
}
```

```javascript  
{
  "_id": "http://example.com/william",
  "_type": "Person",
  "name": {
      "_value": "Prince William",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  }
}
```

```javascript
{
  "_id": "http://example.com/uk",
  "_type": "Place",
  "name": {
      "_value": "Great Britain",
      "_type": "Text"
  }
}
```

Every valid Staple API data object is a valid JSON-LD when extended with the context served by the API. For instance, the objects listed above should be interpreted as JSON-LD under the context:

```javascript
context = {
    "_id": "@id",
    "_value": "@value",
    "_type": "@type",
    "Thing": "http://schema.org/Thing",
    "Person": "http://schema.org/Person",
    "Place": "http://schema.org/Place",
    "Text": "http://schema.org/Text",
    "name": "http://schema.org/name",
    "birthPlace": "http://schema.org/birthPlace",
    "parent": "http://schema.org/parent",
    "children": "http://schema.org/children"
}
```

Thanks to the fixed JSON-LD context assumed and exposed by the API, each data sample, whether part of the input for mutations or a reponse to a query, can be interpreted as a fragment of a larger linked data graph and transformed (e.g., using [JSON-LD Playground](https://json-ld.org/playground/)) into a number of semantically equivallent formats, without loss of the meaning or inviting any semantic ambiguities. 

For instance, the following are some self-contaiend semantic representations of the JSON data object:

```javascript
{
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

---
Flatenned JSON-LD:

```javascript
{
  "@context": context,
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

---
Expanded JSON-LD:

```javascript
{
  "@context": context,
  "_id": "http://example.com/elisabeth",
  "_type": "http://schema.org/Person",
  "http://schema.org/name": {
      "_value": "Queen Elisabeth",
      "_type": "http://schema.org/Text"
  },
  "http://schema.org/birthPlace": {
    "_id": "http://example.com/uk"
  },
  "http://schema.org/children": [
    {
      "_id": "http://example.com/charles"
    }
  ]
}
```

---
N-Triples (RDF):

```ntriple
<http://example.com/elisabeth> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://schema.org/Person> .
<http://example.com/elisabeth> <http://schema.org/name> "Queen Elisabeth"^^<http://schema.org/Text> .
<http://example.com/elisabeth> <http://schema.org/birthPlace> <http://example.com/uk> .
<http://example.com/elisabeth> <http://schema.org/children> <http://example.com/charles> .
```

---
Turtle (RDF):

```turtle
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .

exmple:elisabeth a schema:Person ;
    schema:name "Queen Elisabeth"^^schema:Text ;
    schema:birthPlace example:uk ;
    schema:children example:charles .
```


Nested JSON objects are mapped to JSON-LD and interpretted as semantic graphs in an analogical fashion, for instance:

```javascript
{
  "@context": context,
  "_id": "http://example.com/elisabeth",
  "_type": "Person",
  "name": {
      "_value": "Queen Elisabeth",
      "_type": "Text"
  },
  "birthPlace": {
    "_id": "http://example.com/uk"
  },
  "children": [
    {
      "_id": "http://example.com/charles",
      "name": {
          "_value": "Prince Charles"
      },
      "birthPlace": {
        "_id": "http://example.com/uk",
        "_type": "Place",
        "name": {
          "_value": "Great Britain",
          "_type": "Text"
        }
      }
    }
  ]
}
```

translates into the following Turtle (RDF) data:


```turtle
@prefix schema: <http://schema.org/> .
@prefix example: <http://example.com/> .

exmple:elisabeth a schema:Person ;
    schema:name "Queen Elisabeth"^^schema:Text ;
    schema:birthPlace example:uk ;
    schema:children example:charles .

example:charles schema:name "Prince Charles" ;
    schema:birthPlace example:uk .

example:uk a schema:Place ;
    schema:name "Great Britain"^^schema:Text .
```