import fastify from 'fastify'

const server = fastify()

server.get('/ping', async (request: any, reply: any) => {
  return 'pong\n'
})

server.listen({ port: 8080 }, (err: any, address: any) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})