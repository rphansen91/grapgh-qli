# GrapghQLi

  Quickly get started with GraphQL by auto generating schemas based on current REST endpoints

## Usage

1. `npm install graph-qli -g`
2. `gqli create {{project_name}}`
3. `cd {{project_name}}`
4. `npm install`
5. `npm run dev`

## Query

`gqli query {{query_name}}`

  Will ask to supply a schema or an endpoint.

  After validation of the schema the project will be updated to include the new query

## Mutation

`gqli mutation {{mutation_name}}`

  Will ask to supply a schema or an endpoint.

  After validation of the schema the project will be updated to include the new mutation.
