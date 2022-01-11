const fs = require('fs');
const xray = require('./xray.js');

/*
 * 小数点n位に切り捨て
 */
function floorDecimal(value, n) {
  return Math.floor(value * Math.pow(10, n) ) / Math.pow(10, n);
}


var tmpResult = [];
var result = [];
xray.getSummaries(tmpResult,()=> {
  const datas = xray.reshape(tmpResult,5);

  //make 2D id array
  var idArray = [];
  datas.forEach((elems) => {
    idArray.push(elems.map(x => x.id));
  });
  console.log("idArray.length : " + idArray.length);

  //get trace data
  xray.getTraces(result,idArray,()=>{
    console.log("result.length : " + result.length);
    //console.dir(result,{ depth: null });
    let parsedData = parse(result);
    let csvData = toCsv(parsedData);
    formatCsv(csvData);
  });
});


/**
 * csvフォーマットで表示
 */
function formatCsv(csvData) {
  let header = "total(ms),initialization(ms),invocation(ms),overhead(ms)" + "\n"
  let csv = header += csvData.join('');
  console.log(csv);
}

/**
 * X-Rayから取得したデータを加工しやすいようにパース
 */
function parse(srcDatas) {
  let result = [];

  let datas = srcDatas.map(item => item.Traces).flat();

  for (var i in datas) {
    var obj = {};
    var seqments = datas[i].Segments;
    for (var j in seqments) {
      var json = JSON.parse(seqments[j].Document);
      if(json.origin === "AWS::Lambda") {
        var time_val = floorDecimal((json.end_time - json.start_time)*1000, 2);
        obj.total_exec_time_ms = time_val;
      } else {
        //json.origin === AWS::Lambda::Fucntion
        var details = [];
        for(var k in json.subsegments) {
          var subseg = json.subsegments[k];
          var time_val = floorDecimal((subseg.end_time - subseg.start_time)*1000, 2);
          details.push({name:json.subsegments[k].name,time_ms:time_val});
        }
        obj.details = details;
      }
    }
    result.push(obj);
  }
  return result;
}

/**
 * データをcsvフォーマットに変換
 */
function toCsv(srcDatas) {
  let rowstr = srcDatas.map(item => {
    let str = "";
    let total = item.total_exec_time_ms;
    str += total + ","
    //Initialization(not required),Invocation,Overheadの順番
    let sorted = item.details.sort(function(a, b) {
      return (a.name < b.name) ? -1 : 1;
    });

    if(sorted.length === 3) {
      str += sorted[0].time_ms + ",";
      str += sorted[1].time_ms + ",";
      str += sorted[2].time_ms;
    } else {
      str += ",";
      str += sorted[0].time_ms + ",";
      str += sorted[1].time_ms;
    }
    return str + "\n";
  });
  console.log(rowstr);
  return rowstr;
}
