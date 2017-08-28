const brain = require('fs').readFileSync('./abf.bf', {encoding: 'utf8'}).trim();
const translation = {
    '+': 'math.equation(deref(pointer) = (deref(pointer) + byte(1)):binaryand:byte(255));',
    '-': 'math.equation(deref(pointer) = (deref(pointer) - byte(1)):binaryand:byte(255));',
    '<': 'math.equation(pointer = pointer - void(1));',
    '>': 'math.equation(pointer = pointer + void(1));',
    '[': 'define(defines.label, defines.label.createnew());\nconditional(block.if, boolean.inequality(deref(pointer), byte(0))) {',
    ']': '};\nconditional(block.if, boolean.inequality(deref(pointer), byte(0))) { program.flow.labeledjump(defines.label.last()); };\nundefine(defines.label, defines.label.last());',
    ',': 'math.equation(deref(pointer) = programcode(conversion.changedatatype(program.console.standardoutput.stream.readunbufferedchars(1).getvalue(0), types.byte)));',
    '.': 'program.console.standardoutput.stream.writeunbufferedchars(array.create(1, conversion.changedatatype(deref(pointer), types.character, conversion.method.binary)), 0, 1);'
};

const header = 'program.initialize();\nmath.equation(program.errors.handler.activated = boolean(false));\nprogram.console.standardinput.openstream();\nprogram.console.standardoutput.openstream();\ndefine(defines.variable, variable(pointer));\nimplanttype(pointer, types.pointer(to:types.byte));\nmath.equation(pointer = void(0));\nprogram.memory.allocate(pointer, void(math.infinity), program.memory.memorytype.bidirectional);';
const footer = 'program.memory.deallocate(pointer, void(math.infinity), program.memory.memorytype.bidirectional);\nundefine(defines.variable, variable(pointer));\nprogram.console.standardoutput.closestream();\nprogram.console.standardinput.closestream();\nprogram.terminate();';
const comment = '~!comment!~MANDATORY~!uncomment!~';

function translate(brain){
    let str = '';
    let bytes = 0;

    add(header);
    for(let char of brain)
        add(translation[char]);
    add(footer);
    return str;

    function add(command){
        if(bytes + command.length + comment.length + 2 > 1000){
            str += comment + '\n';
            bytes = 0;
        }
        str += command + '\n';
        bytes += command.length + 1;
    }
}

console.log(translate(brain));