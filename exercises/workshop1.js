module.exports = {
  initial: function () {
    //********** 1 **********//
    // write a function "greeting" that returns 'hello world'

    // primitives like number, boolean and string are passed by value
    // write a function square that muliplies a number by itself
    var y = 5;
    // use your function to square y

    // non-primitives like array and objects are passed by reference
    var nums = [5, 1, 3, 2, 4];
    // write a function that sorts an array
    function sortArr(arr) {
        arr.sort();
        // notice no return needed
    }
    sortArr(nums);


    // JavaScript is function scope, set result equal to the value of x
    var x = 'test';

    function canadianize(x) {
        x = x + ' eh';
        // notice no return statement needed
    }
    canadianize();
    // hint: javascript is not block-scope, only function
    {
        x = x + '?';
    }
    var result = ''; // type the string here not x


    // if not found in the current scope, the outer scope is checked recursively until found
    var a = 0;

    function addFive() {
        addTen();

        function addTen() {
            a = a + 10; // a not found in current scope, check outer scope
        }

        a = a + 5; // a not found in current scope, go to outer scope
    }
    addFive();
    // addTen(); // error! - addTen is not in the current scope or parent scope
    console.log(a); // 15


    // What is z.one after calling resetObject?
    var z = {
        'one': 1
    };

    function resetObject(obj) {
        // modify a property (by reference) on obj
        obj.one = 2;
        // change the reference of obj
        obj = {
            'one': 3
        };
        // changed reference updated
        obj.one = 4;
    }
    resetObject(z);


    // function declarations vs named function expressions
    //console.log(sq2(5)); // error, sq2 is not a function
    var sq2 = function sq2(n) { // the second sq2 is optional here
        n = n * n;
    };
    console.log(sq3(5)); // works!
    function sq3(n) {
        n = n * n;
    }

    // a named function declaration doesn't have to match
    // CAUTION: this is one of the confusing things that you could do but shouldn't
    var sq3 = function doThings(n) {
        // function name here is doThings
        return n * n;
    };
    var b = sq3(5); // 25
    //var c = doThings(5); // error doThings is not defined


    // write a recursive function sumInts that sums integers from 1 to 100
    function sumInts(start, end) {
        start++;
        // CAUTION: each function call allocates memory on the function stack, this can result in call stack overflow errors
        return start === end ? start : start + sumInts(start, end);
    }
    console.log(sumInts(0, 100));
  },
  tests: function(code) {
    describe('Functions', function () {
        it('greeting should return hello world', function () {
            (greeting()).should.equal('hello world');
        });

        it('result should equal x', function () {
            (result).should.equal(x);
        });

        it('y should be 25', function () {
            (y).should.equal(25);
        });

        it('nums array should be sorted', function () {
            (nums[3]).should.equal(4);
        });

        it('sumInts should sum', function () {
            (sumInts(0, 100)).should.equal(5050);
        });
    });
  }
};
