const readline = require('readline-sync')
const robots = {
    //userInput:  require('./robots/user-input.js'),
    text:require ('./robots/text.js')
}

async function start() {
    const content = {}
    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()
    
    await robots.text(content)

    function askAndReturnSearchTerm(){
        return readline.question('Digite um termo da Wikipedia')

    }

    function askAndReturnPrefix(){
        const prefixs = ['Quem e ', 'O que é', 'A Historia de']
        const selectedPrefixIndex = readline.keyInSelect(prefixs, 'Escolha uma opção')
        const selectedPrefixText  = prefixs[selectedPrefixIndex]
     
        return(selectedPrefixText)
    }

    console.log(content)

}

start()