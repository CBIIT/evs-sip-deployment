const neo4j = require('neo4j-driver')


const driver = neo4j.driver('neo4j://localhost:7687', neo4j.auth.basic('neo4j', 'test'))
const session = driver.session()
const personName = 'Chao'

async function test(){ 
try {
    console.log("start")
  const result = await session.run(
    'MATCH (a:User {first_name: $name}) RETURN a',
    { name: personName }
    //'MATCH (u:User) RETURN u'
  )
  //  const result = await session.readTransaction(txc => txc.run('MATCH (user:User ) RETURN user' ))

  const singleRecord = result.records[0]
  const node = singleRecord.get(0)

  console.log(node.properties)
} finally {
  await session.close()
  await driver.close()
}
}

// on application exit:

test()
