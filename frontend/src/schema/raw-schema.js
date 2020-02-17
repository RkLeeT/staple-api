const schemaString = `@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix example: <http://example.com/> .
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

`

module.exports = schemaString;