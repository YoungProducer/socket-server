const { app, server } = require('../lib/index');

server.listen(app.get('PORT'), () => {
    console.log(`App listening to ${app.get('PORT')}...`, `mode: ${app.get('env')}`);
});
