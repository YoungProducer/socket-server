const app = require('../lib/index').default;

app.listen(app.get('PORT'), () => {
    console.log(`App listening to ${app.get('PORT')}...`, `mode: ${app.get('env')}`);
});
