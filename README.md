#minschema
a (html form) schema builder & validator

##install

    npm i minschema

##usage

    var MinSchema = require("minschema");
    
    var schema = new MinSchema({
    	name: String,
    	age: Number
    });

    var html = schema.toString(); //returns HTML form
    console.log(schema.verify({name: "FOO", age: "100"})); //true

License: BSD
