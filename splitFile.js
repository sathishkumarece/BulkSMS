// Splits a given file into smaller subfiles by line number
const fs = require('fs');
var fileCount = 1
var count = 0

function splitFile(indir, infileName, outdir) {
  var outStream;
  var outfileName
  return new Promise(function(resolve, reject){
    const splitFileName = infileName.split('.')
    newWriteStream()
    var inStream = fs.createReadStream(indir+'/'+infileName)
  
    var lineReader = require('readline').createInterface({
      input: inStream,
    })
  
    function newWriteStream() {
      outfileName = `${splitFileName[0]}${fileCount}.txt`
      outStream = fs.createWriteStream(outdir+'/'+outfileName)
      count = 0
    }
  
    lineReader.on('line', function (line) {
      count++
      if(count > 1){
        outStream.write(',')
      }
      outStream.write(line)
      if (count >= 299) {
        fileCount++
        console.log('file ', outfileName, count)
        outStream.end()
        newWriteStream()
      }
    })
  
    lineReader.on('close', function () {
      if (count > 0) {
        console.log('Final close:', outfileName, count)
      }
      inStream.close()
      outStream.end()
      console.log('Done')
      resolve('File split is completed:'+fileCount) 
    })
  })
}

module.exports = splitFile;