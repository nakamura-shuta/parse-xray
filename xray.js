let AWS = require('aws-sdk');
const AWSXRay = require('aws-xray-sdk');
var xray = new AWS.XRay({region:"us-west-2"});

//X-Rayデータ取得開始時刻&終了時刻
var start =  new Date();
start.setMinutes(start.getMinutes() - 60);
var end =  new Date();

/**
 * X-Rayのサマリー取得
 */
function getSummaries(result, callback,token) {
  var params = {
    StartTime: start,
    EndTime: end,
    NextToken : token
  };
  xray.getTraceSummaries(params, function(err, datas) {
    if (err) {
      console.log(err, err.stack);
    } else {
      for(data in datas.TraceSummaries) {
        result.push({
          id:datas.TraceSummaries[data].Id,
          name:datas.TraceSummaries[data].EntryPoint.Name
        });
      }

      if(datas.NextToken !== null) {
        getSummaries(result,callback,datas.NextToken);
      } else {
        callback();
      }
    }
  });
}


/**
 * reshape 1D to 2D
 */
function reshape(array,elementCount) {
  if(!array) {
    return;
  }
  let resultArray = [];
  let copy = array.slice(0);
  if(array.length <= elementCount || elementCount === 0) {
    return array;
  }

  let index = 0;

  while (index < array.length) {
    let result = copy.slice(index,index + elementCount);
    if(result === 0) {
      break;
    }

    resultArray.push(result);
    index += elementCount;
  }

  return resultArray;
};


/**
 * X-Rayの詳細取得
 */
function getTraces(result,traceDatas,callback) {

  let targetDatas = traceDatas.pop();
  if(targetDatas == null) {
    callback();
  } else {
    var params = {
      TraceIds:targetDatas
    };
    xray.batchGetTraces(params,(err, data) => {
      // proccess err and data.
      if(err) {
        console.log(err);
      } else {
        result.push(data);
        getTraces(result,traceDatas,callback);
      }
    });
  }
}


exports.getSummaries = getSummaries;
exports.reshape = reshape;
exports.getTraces = getTraces;
