module.exports = MinSchema;

var encode = require("entities").encodeHTML5;

function MinSchema(schema, options){
	this._schema = schema;
	this._options = options;
	this._keys = Object.keys(schema);

	var requireDefault = !options || !("requireDefault" in options) || options.requireDefault;

	this._keys.forEach(function(k){
		var val = schema[k];

		if(typeof val !== "object" || Array.isArray(val)){
			schema[k] = val = {
				type: val,
				required: requireDefault
			};
		}

		var type = val.type;

		if(type === "text"){
			type = val.type = String;
		}

		if(type === String && "pattern" in val){
			type = val.type = val.pattern;
			//delete val.pattern;
		}
	});
}

MinSchema.prototype.verify = function(data){

	var schema = this._schema;
	return this._keys.every(function(k){

		var val = schema[k];
		var type = val.type;

		if(type instanceof MinSchema){

			return type.verify(data);

		} else if(type === Boolean){

			if(typeof data[k] !== "boolean") data[k] = data[k] === "on";
			return true;

		} else if(!Object.prototype.hasOwnProperty(data, k)){

			if(val.defaults){
				data[k] = val.defaults;
			}
			return !val.required; 

		} else if(Array.isArray(type)){

			return type.some(function(option){

				return typeof option === "string" ?
					option === type :
					option.name === type;

			});

		} else if(type === Number){

			data[k] = parseInt(data[k], 10);

			return data[k] === data[k] &&
					!("min" in val && data[k] < val.min) &&
					!("max" in val && data[k] > val.max);

		} else if(type === Date){

			data[k] = new Date(data[k]);
			var millis = data[k].getTime();

			return millis === millis &&
				!(
					"min" in val &&
					typeof val.min === "number" ?
						millis < val.min :
						millis < val.min.getTime()
				) &&
				!(
					"max" in val &&
					typeof val.max === "number" ?
						millis < val.max :
						millis < val.max.getTime()
				);

		} else if(type instanceof RegExp){

			return type.test(data[k]);

		} else if(type === String) {

			return !val.required || !!data[k];

		} else if(typeof type === "function"){

			return type(data[k], k, data);

		} else if(typeof type === "string"){

			return true; //accept whatever is there

		}
	});
};

MinSchema.prototype.toString = function(){

	var data = "";

	function addExtraFields(fields){

		fields.forEach(function(name){

			data += " " + name;
			if(name !== "required" && name !== "disabled"){
				data += "\"" + encode(val[name]) + "\"";
			}

		});

	}

	function addOption(name){

		var value;

		if(typeof name !== "string"){

			value = encode(name.value);
			name = encode(name.name);

		} else {

			name = value = encode(name);

		}

		data += "<option value=\"";
		data += name + "\">" + value;
		data += "</option>";

	}

	for(var i = 0; i < this._keys.length; i++){

		var name = this._keys[i],
		    val = this._schema[name],
		    type = val.type,
		    htmlName = encode(name),
		    extraFields = Object.keys(val).filter(
				RegExp.prototype.test,
				/^(?:required$|disabled$|value$|placeholder$|data\-)/
			);

		if(val.label){

			data += "<label for=\"" + htmlName + "\">";
			data += encode(val.label) + "</label>";

		}

		if(type instanceof MinSchema){

			data += type.toString();

		} else if(Array.isArray(type)){

			data += "<select name=\"" + htmlName;

			if(val.multiple) data += " multiple";

			addExtraFields(extraFields);

			data +=  "\">";

			type.forEach(addOption);

			data += "</select>";

		} else {

			data += "<input name=\"" + htmlName + "\"";

			addExtraFields(extraFields);

			data += " type=\"";

			if(type === Number){

				data += "number";

			} else if(type === Date){

				data += "date";

			} else if(type === Boolean){

				data += "checkbox";

			} else if(typeof type === "function" /*|| type === String*/){

				data += "text";

			} else if(type instanceof RegExp){

				data += "text\" pattern=\"";
				data += encode(type.source);

			} else if(typeof type === "string"){

				data += encode(type);

			} else {

				throw Error("unknown type");

			}

			data += "\">";
		}
	}

	return data;
};