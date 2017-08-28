function add(count=1) {
    if(count < 0)
        return sub(-count);
    return '+'.repeat(count)
}
function sub(count=1) {
    if(count < 0)
        return add(-count);
    return '-'.repeat(count);
}
function rawleft(count=1) {
    if(count < 0)
        return rawright(-count);
    return '<'.repeat(count);
}
function rawright(count=1) {
    if(count < 0)
        return rawleft(-count);
    return '>'.repeat(count);
}
function loop(body) {
    return '['+body()+']';
}
function read(){
    return ',';
}
function write(){
    return '.';
}

function bl(body){
    let cmd = body();
    let last;
    do{
        last = cmd;
        cmd = cmd.replace(/\+-/g, '');
        cmd = cmd.replace(/-\+/g, '');
        cmd = cmd.replace(/<>/g, '');
        cmd = cmd.replace(/></g, '');
    }while(cmd !== last);
    return cmd;
}

const ROOT = 'root';
const SYMBOLS = '+-,.<>[]';
let channels = [ROOT];
let channel = ROOT;

function defineChannel(name){
    channels.push(`${name}-pointer`, name);
}
function jump(name){
    let prev = channel;
    channel = name;
    return bl(() =>
        rawright(channels.indexOf(name) - channels.indexOf(prev))
    );
}
function jumpLeft(count=1){
    return rawleft(channels.length * count);
}
function jumpRight(count=1){
    return rawright(channels.length * count);
}
function seek(move){
    return bl(() =>
        sub() +
        loop(() =>
            add() +
            move() +
            sub()
        ) +
        add()
    );
}
function returnToRoot(){
    return bl(() =>
        jump(ROOT) +
        seek(jumpLeft)
    );
}
function goto(name){
    if(channel !== name){
        let prefix;
        if(channel !== 'root')
            prefix = returnToRoot;
        else
            prefix = () => '';
        return bl(() =>
            prefix() +
            jump(`${name}-pointer`) +
            seek(jumpRight) +
            jump(name)
        );
    }else{
        return '';
    }
}
function left(count=1){
    if(count < 0)
        return right(-count);
    else
    if(count === 0)
        return '';
    let chan = channel;
    return bl(() =>
        jump(`${chan}-pointer`) +
        sub() +
        jump('root') +
        loop(() =>
            sub() +
            jumpLeft(count) +
            add() +
            jumpRight(count)
        ) +
        jump(`${chan}-pointer`) +
        jumpLeft(count) +
        add() +
        jump(chan)
    );
}
function right(count=1){
    if(count < 0)
        return left(-count);
    else
    if(count === 0)
        return '';
    let chan = channel;
    return bl(() =>
        jump(`${chan}-pointer`) +
        sub() +
        jumpRight(count) +
        add() +
        jump(chan)
    );
}
function program(start, body){
    let cmd = bl(() =>
        add() +
        (() => {
            let str = '';
            for(let i = 1; i < channels.length; i += 2)
                str += jump(channels[i]) + add();
            return str;
        })() +
        jump(start) +
        body()
    );
    cmd = cmd.replace(/^[<>]+/, '');
    cmd = cmd.replace(/[<>]+$/, '');
    return cmd;
}
function swi(values, elze=()=>''){
    let arr = [];
    for(let key of Object.keys(values)){
        let val = values[key];
        let i;
        for(i = 0; i < arr.length; i++){
            if(arr[i][0] > key)
                break;
        }
        arr.splice(i, 0, [key, val]);
    }
    let chan = channel;
    return bl(() =>
        loop(() =>
            sub() +
            toRoot() +
            add() +
            jumpRight() +
            add() +
            jumpLeft() +
            fromRoot()
        ) +
        toRoot() +
        loop(() =>
            sub() +
            fromRoot() +
            add() +
            toRoot()
        ) +
        add() +
        jumpRight() +
        handle(0) +
        fromRoot()
    );

    function toRoot(){
        return bl(() =>
            jump(ROOT) +
            jumpRight()
        );
    }
    function fromRoot(){
        return bl(() =>
            jumpLeft() +
            jump(chan)
        );
    }
    function handle(index, prev=0){
        let [key, val] = arr[index];
        return bl(() =>
            sub(key - prev) +
            loop(() => {
                if(index === arr.length - 1){
                    return bl(() =>
                        jumpLeft() +
                        sub() +
                        jumpRight() +
                        loop(sub) +
                        elze()
                    );
                }else{
                    return bl(() =>
                        handle(index + 1, key) +
                        jumpRight()
                    );
                }
            }) +
            jumpLeft() +
            loop(() =>
                sub() +
                fromRoot() +
                val() +
                toRoot()
            )
        );
    }
}
function ifzero(body){
    let chan = channel;
    return bl(() =>
        loop(() =>
            sub() +
            toRoot() +
            add() +
            jumpRight() +
            add() +
            jumpLeft() +
            fromRoot()
        ) +
        toRoot() +
        loop(() =>
            sub() +
            fromRoot() +
            add() +
            toRoot()
        ) +
        add() +
        jumpRight() +
        loop(() =>
            jumpLeft() +
            sub() +
            jumpRight() +
            loop(sub)
        ) +
        jumpLeft() +
        loop(() =>
            sub() +
            fromRoot() +
            body() +
            toRoot()
        ) +
        fromRoot()
    );

    function toRoot(){
        return bl(() =>
            jump('root') +
            jumpRight()
        );
    }
    function fromRoot(){
        return bl(() =>
            jumpLeft() +
            jump(chan)
        );
    }
}
function code(char){
    return SYMBOLS.indexOf(char) + 1;
}
function encode(offset=0){
    return handle(0, offset);
    function handle(index, prev){
        let i = SYMBOLS.charCodeAt(index);
        return bl(() =>
            sub(i - prev) +
            loop(() =>
                index === SYMBOLS.length - 1
                    ? bl(() =>
                        loop(sub) +
                        jumpLeft() +
                        sub(SYMBOLS.length) +
                        jumpRight()
                    )
                    : handle(index + 1, i)
            ) +
            jumpLeft() +
            add() +
            jumpRight()
        );
    }
}
function doIn(chan, body){
    let orig = channel;
    return bl(() =>
        goto(chan) +
        body() +
        goto(orig)
    );
}
function matchingSymbol(open, close, move){
    let chan = channel;
    return bl(() =>
        returnToRoot() +
        jumpLeft() +
        add() +
        loop(() =>
            goto(chan) +
            move() +
            swi({
                [open]: () => bl(() =>
                    returnToRoot() +
                    loop(jumpLeft) +
                    add() +
                    goto(chan)
                ),
                [close]: () => bl(() =>
                    returnToRoot() +
                    loop(jumpLeft) +
                    jumpRight() +
                    sub() +
                    goto(chan)
                )
            }) +
            returnToRoot() +
            jumpLeft()
        ) +
        goto(chan)
    );
}
function print(string){
    let str = '';
    let prev = 0;
    for(let i = 0; i < string.length; i++){
        let c = string.charCodeAt(i);
        str += add(c - prev);
        str += write();
        prev = c;
    }
    return str;
}

defineChannel('prog');
defineChannel('data');
const sentinel = ' ';
const sentinalCode = sentinel.charCodeAt(0);
console.log(
    program('prog', () =>
        jumpRight() +
        read() +
        sub(sentinalCode) +
        loop(() =>
            encode(sentinalCode) +
            jumpRight() +
            read() +
            sub(sentinalCode)
        ) +
        returnToRoot() +
        jump('prog') +
        loop(() =>
            swi({
                [code('+')]: () => doIn('data', add),
                [code('-')]: () => doIn('data', sub),
                [code(',')]: () => doIn('data', read),
                [code('.')]: () => doIn('data', write),
                [code('<')]: () => doIn('data', left),
                [code('>')]: () => doIn('data', right),
                [code('[')]: () => doIn('data', () =>
                    ifzero(() =>
                        doIn('prog', () =>
                            matchingSymbol(code('['), code(']'), right)
                        )
                    )
                ),
                [code(']')]: () => bl(() =>
                    matchingSymbol(code(']'), code('['), left) +
                    left()
                )
            }) +
            right()
        )
    )
);