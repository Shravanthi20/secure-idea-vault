exports.toBuffer= (input)=>{
    if(Buffer.isBuffer(input)) return input;
    return Buffer.from(input);
};