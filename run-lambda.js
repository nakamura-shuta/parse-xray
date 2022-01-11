const { setTimeout } = require('timers/promises');
let AWS = require('aws-sdk');
let lambda = new AWS.Lambda({region:"us-west-2"});

var action = process.argv[2];
var function_name = process.argv[3];
var exec_count = process.argv[4];


if(action === "list") {
  lambda.listFunctions({},function(err,data){
    console.log("=== executable lambda list ===");
    for(var i in data.Functions) {
      console.log(data.Functions[i].FunctionName);
    }
  });
} else {
  if(function_name == null || exec_count == null) {
    console.log("usage : node run-lambda.js list | run  <function name> <exec count>")
    process.exit(1);
  }
}


console.log("invoke lambda : " + function_name);
var params = {
  FunctionName: function_name,
  InvocationType: 'RequestResponse'
};

const exec = async () => {
  for(var i =0; i < exec_count;i++) {
    lambda.invoke(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log('invoke function');
        console.log(data);
      }
    });
    await setTimeout(2000);
  }
}

exec();
