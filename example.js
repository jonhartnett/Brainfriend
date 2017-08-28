function interpreter(program, input){
    let i = 0;
    let output = '';
    let memory = [0] * 256;
    function read() {
        return input[i++];
    }
    function write(c) {
        output += c;
    }

    function intepret(){
        let ip = 0;
        let mp = 0;
        while(true){
            switch(program[ip]){
                case '+':
                    memory[mp]++;
                    continue;
                case '-':
                    memory[mp]--;
                    continue;
                case '<':
                    mp--;
                    continue;
                case '>':
                    mp++;
                    continue;
                case '[':
                    if(memory[mp] !== 0){
                        let i = 1;
                        ip++;
                        while(i !== 0){
                            if(program[ip] === '[')
                                i++;
                            if(program[ip] === ']')
                                i--;
                            ip++;
                        }
                    }
                    continue;
                case ']':
                    if(memory[mp] !== 0){
                        let i = 1;
                        ip--;
                        while(i !== 0){
                            if(program[ip] === ']')
                                i++;
                            if(program[ip] === '[')
                                i--;
                            ip--;
                        }
                    }
                    continue;
                case ',':
                    memory[mp] = read();
                    continue;
                case '.':
                    write(memory[mp]);
                    continue;
            }
            break;
        }
    }
}