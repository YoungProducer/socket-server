const { app, server } = require('../lib/index').default;

server.listen(app.get('PORT'), () => {
    console.log(`App listening to ${app.get('PORT')}...`, `mode: ${app.get('env')}`);
});
