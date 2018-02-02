var words, lines;

function getStats(txt) {
    txt = txt.toLowerCase(); //Lowercase entire text string before getting statistics
    words = null;
    lines = null;
    return {
        nChars: nChars(txt),
        nWords: nWords(txt),
        nLines: nLines(txt),
        nNonEmptyLines: nNonEmptyLines(txt),
        averageWordLength: averageWordLength(txt),
        maxLineLength: maxLineLength(txt),
        palindromes: palindromes(txt),
        longestWords: longestWords(txt),
        mostFrequentWords: mostFrequentWords(txt)
    };
}

function nChars(txt) {
    return txt.length;
}

function nWords(txt) {
    return getWords(txt).length;
}

function nLines(txt) {
    return getLines(txt).length;
}

function nNonEmptyLines(txt) {
    var lines = getLines(txt);
    var nonemptylines = 0;
    for (var i = 0; i < lines.length; i++) {
       lines[i].match(/[^\n\s\t]+/g) ? nonemptylines++ : null;
    }
    return nonemptylines;
}

function averageWordLength(txt){
    var words  = getWords(txt);
    var sum = 0;

    words.forEach(getLength)
    function getLength(word) { 
        sum += word.length; 
    }
    return sum/words.length || 0;
}

function maxLineLength(txt) {
    var lines = getLines(txt);
    var max = 0;

    lines.forEach(getMax)
    function getMax(line) {
        max = max < line.length ? line.length : max;
    }
    return max;
}

function palindromes(txt) {
    var words = getWords(txt).reduce(largerThanTwoChars, []);
    function largerThanTwoChars(matchingWords, word) {
        word.length > 2 ? matchingWords.push(word) : null;
        return matchingWords;
    }
    var palindromes = words.reduce(findPalindromes, []);
    function findPalindromes(palindromes, word) {
        var drow = word.split('').reverse().join('');
        drow === word ? palindromes.push(word) : null;
        return palindromes;
    }
    return palindromes;
}

function longestWords(txt) {
    var words = Array.from(new Set(getWords(txt))); //get the words and dedupe using a set

    words.sort(compareLengths);
    function compareLengths(a, b) {
        var primary =  b.length - a.length; // primary sort on length
        var secondary = a.localeCompare(b); // secondary sort alphabetically
        return primary || secondary;
    }

    return words.length > 10 ? words.slice(0, 10) : words; // return a max of 10 words
}

function mostFrequentWords(txt) {
    var words = getWords(txt);
    /*  find the frequency of every word in the text, and create an object
        representing each word and their frequencies */
    var frequentWords = words.reduce((matchedWords, currentWord) => {
        matchedWords.hasOwnProperty(currentWord) ? matchedWords[currentWord] += 1 : matchedWords[currentWord] = 1;
        return matchedWords;
    }, {});
    /*  Object.entries() generates array of the word frequencies with the frequent words 
        so we have something thats sortable. This looks something like [["bazooka", 5], ["boom", 7]]
        After that, we sort based on frequency for each word */
    frequentWords = Object.entries(frequentWords).sort((a, b) => {
        primary = b[1] - a[1]; //primary sort on frequencies
        secondary = a[0].localeCompare(b[0]); // secondary sort alphabetically 
        return primary || secondary;
    });
    // Take our sorted list and map to concatenate the frequency to the word to look like: ["boom(7)", "bazooka(5)"]
    frequentWords = frequentWords.map(pair => pair[0] + "(" + pair[1] + ")");
    
    return frequentWords.length > 10 ? frequentWords.slice(0, 10) : frequentWords; // return a max of 10 words;
}


//getter methods for words and lines
function getWords(txt) {
    words = words || txt.match(/[\w\d]+/g) || []; //Only regex matches once if called multiple times
    return words;
}

function getLines(txt) {
    lines = lines || txt.split("\n") || []; ////Only splits once if called multiple times
    return lines;
}

function isTextEmpty(txt) {
    return txt.length === 0;
}

