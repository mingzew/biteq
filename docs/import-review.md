# Import review

Every question we import from another source and change (answer, options, prompt or explanation) is listed here,
with the source's version next to ours, so a person can check the change. This file is kept up to date: add an
entry for each changed question whenever you import (see "Importing questions" in
[formatting-rules.md](../plugins/biteq/data/questions/formatting-rules.md)). The plugin does not read it.

## How to use it

- **Checked by us:** every entry starts unchecked (`- [ ] Checked by us`). After reviewing it, tick it (`- [x]`) and
  add your initials and the date, e.g. `- [x] Checked by us (MW, 2026-10-20)`. Search for `[ ]` to see what is left.
- If you disagree with a change, fix the question in the bank, update the entry here, and tick it.
- ✅ marks the correct option. *Explanation* says whether we rewrote the source's explanation.
- *Practicality* is our 1-10 score; how we score it is under "Practicality" in formatting-rules.md.

## Imports

| Source | Commit | Ids | Imported |
|---|---|---|---|
| lydiahallie/javascript-questions | a8b427b9f7f9 | `js-lydia-<n>` | 2026-10-14 |
| freeCodeCamp/Developer_Quiz_Site | d71a60ba0811 | `python-fcc-<n>`, `cs-fcc-<n>`, `js-fcc-<n>` | 2026-10-18 |

## 1. The source marked the wrong answer (8)

I changed which answer is correct. Check these first.

### `python-fcc-010` (python-quiz.ts #10)

- [ ] Checked by us

*Why:* 'free' + 'code camp' is 'freecode camp': + adds no space.

*Explanation:* rewritten · *Practicality:* 7

**Original**

In Python, if we have word ='free' and phrase='code camp', then what is the result here: print(word + phrase)?

- ✅ free code camp
- ▫️ free camp code
- ▫️ free + code camp
- ▫️ code camp free

> To concatenate two strings, you can use the + operator.

**Ours**

What does this print?

```
word = 'free'
phrase = 'code camp'
print(word + phrase)
```

- ▫️ free + code camp
- ✅ freecode camp
- ▫️ free code camp
- ▫️ code campfree

> + joins strings exactly as they are, without adding a space. 'free' has no trailing space, so the result is 'freecode camp'.
> 
> 'free' + ' ' + 'code camp'   # 'free code camp'
> f'{word} {phrase}'           # same, with an f-string

---

### `python-fcc-121` (python-quiz.ts #121)

- [ ] Checked by us

*Why:* range(4) is 0, 1, 2, 3, not 1-4.

*Explanation:* rewritten · *Practicality:* 8

**Original**

In Python, Function range(4) will yield an iterable sequence like: 

- ✅ [1,2,3,4]
- ▫️ [0,1,2,3,4]
- ▫️ [0,1,2,3]
- ▫️ [4]

> If you don't specify the start index, the default start index of 0 is used.

**Ours**

Function range(4) will yield an iterable sequence like:

- ▫️ [0, 1, 2, 3, 4]
- ▫️ [4]
- ✅ [0, 1, 2, 3]
- ▫️ [1, 2, 3, 4]

> range(4) starts at 0 by default and stops before 4: 0, 1, 2, 3.

---

### `cs-fcc-013` (general-cs-quiz.ts #13)

- [ ] Checked by us

*Why:* Kruskal's algorithm builds a minimum spanning tree, not shortest paths. Dijkstra's finds shortest paths.

*Explanation:* rewritten · *Practicality:* 5

**Original**

Which of the following algorithms is used to find the shortest path between two points in a connected weighted graph?

- ✅ Kruskal Algorithm
- ▫️ Floyd's Tortoise-Hare Algorithm
- ▫️ Greedy Algorithms
- ▫️ Prims Algorithms

> Kruskal Algorithm is used to find the shortest path between two points in a connected weighted graph.

**Ours**

Which of the following algorithms is used to find the shortest path between two points in a connected weighted graph?

- ▫️ Kruskal Algorithm
- ✅ Dijkstra's Algorithm
- ▫️ Prims Algorithms
- ▫️ Floyd's Tortoise-Hare Algorithm

> Dijkstra's algorithm finds shortest paths from a source in a graph with non-negative weights. Kruskal's and Prim's build a minimum spanning tree, which is not the same as shortest paths. Floyd's tortoise and hare finds cycles in a linked list.

---

### `cs-fcc-134` (general-cs-quiz.ts #134)

- [ ] Checked by us

*Why:* Insertion sort is the standard answer for nearly sorted data (close to O(n)). The source marked bubble sort and listed insertion sort as a wrong option.

*Explanation:* rewritten · *Practicality:* 6

**Original**

Which sorting algorithm is best when data is nearly sorted?

- ✅ Bubble Sort
- ▫️ Merge Sort
- ▫️ Insertion Sort
- ▫️ Selection Sort

> If the list is nearly sorted, then Bubble Sort is a good choice because it will sort the data with only a few passes of the array.

**Ours**

Which sorting algorithm is best when data is nearly sorted?

- ▫️ Heap Sort
- ▫️ Merge Sort
- ▫️ Selection Sort
- ✅ Insertion Sort

> Insertion sort does about n comparisons when each element is already near its place, so it runs in close to O(n) on nearly sorted data. Selection sort is O(n^2) regardless.

---

### `cs-fcc-175` (general-cs-quiz.ts #175)

- [ ] Checked by us

*Why:* The marked answer defines a perfect binary tree, not a complete one (and was duplicated as a wrong option).

*Explanation:* rewritten · *Practicality:* 3

**Original**

What is a key characteristic of a complete binary tree?

- ✅ It has the maximum number of nodes for a given height
- ▫️ All nodes have exactly two children.
- ▫️ The last level may have gaps in node positions
- ▫️ It has the maximum number of nodes for a given height

> The key characteristic of a complete binary tree is that it contains the maximum possible number of nodes for a tree of its height. This maximizes the number of nodes that can be accommodated while maintaining the structure's completeness.

**Ours**

What is a key characteristic of a complete binary tree?

- ▫️ All nodes have exactly two children
- ✅ Every level is full except possibly the last, which fills from the left
- ▫️ The last level may have gaps between nodes
- ▫️ It has the maximum number of nodes for its height

> A complete binary tree fills level by level, left to right, which is why a heap can be stored in a plain array. A tree with the maximum number of nodes for its height is a perfect binary tree.

---

### `cs-fcc-176` (general-cs-quiz.ts #176)

- [ ] Checked by us

*Why:* The postfix of 3 * (5 + 2) is 3 5 2 + *. The marked answer, 3 5 2 * +, means 3 + 5 * 2 (and was duplicated).

*Explanation:* rewritten · *Practicality:* 3

**Original**

What is the postfix notation for the infix expression: 3 * (5 + 2)?

- ✅ 3 5 2 * +
- ▫️ 3 5 2 + *
- ▫️ 3 5 + 2 *
- ▫️ 3 5 2 * +

> The postfix notation for the infix expression "3 * (5 + 2)" is "3 5 2 * +". This notation represents the same mathematical expression and can be directly evaluated using a stack-based algorithm.

**Ours**

What is the postfix notation for the infix expression: 3 * (5 + 2)?

- ▫️ * 3 + 5 2
- ▫️ 3 5 + 2 *
- ✅ 3 5 2 + *
- ▫️ 3 5 2 * +

> In postfix, each operator follows its operands. 5 + 2 becomes 5 2 +, then 3 * (that) becomes 3 5 2 + *. Evaluated with a stack: push 3, 5, 2; + gives 7; * gives 21.

---

### `js-fcc-053` (javascript-quiz.ts #53)

- [ ] Checked by us

*Why:* reverse() only flips the current order; it does not sort. The question is now how to sort descending.

*Explanation:* rewritten · *Practicality:* 8

**Original**

In JavaScript, what method is used to arrange array values into descending order?

- ✅ reverse()
- ▫️ from()
- ▫️ unshift()
- ▫️ join()

> The reverse() method reverses an array in place. The first array element becomes the last, and the last array element becomes the first.

**Ours**

How do you sort an array of numbers into descending order?

- ✅ arr.sort((a, b) => b - a)
- ▫️ arr.sort()
- ▫️ arr.sort((a, b) => a - b)
- ▫️ arr.reverse()

> sort() with a compare function orders by its sign: b - a puts larger numbers first. reverse() only flips the current order, and sort() with no compare function sorts as strings ([10, 9, 1].sort() gives [1, 10, 9]).

---

### `js-fcc-135` (javascript-quiz.ts #135)

- [ ] Checked by us

*Why:* classList is a property, not a method. You add classes with classList.add().

*Explanation:* rewritten · *Practicality:* 7

**Original**

Which JavaScript DOM manipulation method adds multiple classes to an element?

- ✅ classList()
- ▫️ className
- ▫️ classVar
- ▫️ classConstructor

> The classList() method adds multiple classes to an element. You can use it to add a class or multiple classes to an element by attaching the add() method to it. For example classList.add('btn'), or classList.add('btn', 'btn-block')

**Ours**

How do you add two classes to an element at once?

- ▫️ element.classList('a', 'b')
- ✅ element.classList.add('a', 'b')
- ▫️ element.addClass('a', 'b')
- ▫️ element.className.add('a', 'b')

> classList is a property holding the element's classes; its add() takes any number of class names. className is a plain string, and addClass is jQuery.

---

## 2. A "wrong" option was also correct (13)

I replaced that option (or narrowed the prompt) so exactly one answer is right.

### `python-fcc-155` (python-quiz.ts #155)

- [ ] Checked by us

*Why:* math.pow(9, 3) is also NOT 5 to the 9th, so two options were correct.

*Explanation:* rewritten · *Practicality:* 5

**Original**

In Python, which of the following is NOT the right way to find 5 raised to the power of 9?

- ✅ print(deg(5,9))
- ▫️ print(5**9)
- ▫️ print(pow(5,9))
- ▫️ print(math.pow(9, 3))

> In Python, the '**' operator, the built-in function pow() and the math.pow() function are three different ways to get the exponent to the base.

**Ours**

Which of the following is NOT the right way to find 5 raised to the power of 9?

- ▫️ print(5**9)
- ▫️ print(math.pow(5, 9))
- ▫️ print(pow(5, 9))
- ✅ print(deg(5,9))

> There is no built-in deg() function. 5**9, pow(5, 9) and math.pow(5, 9) all compute 5 to the 9th (math.pow returns a float).

---

### `cs-fcc-008` (general-cs-quiz.ts #8)

- [ ] Checked by us

*Why:* A heap is how a priority queue is usually implemented, so "Heap" was also right.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

In a graph, which data structure is best suited for finding the shortest path between two vertices?

- ✅ Priority Queue
- ▫️ Stack
- ▫️ String
- ▫️ Heap

> Dijkstra's algorithm, which is used to find the shortest path in a graph, typically employs a priority queue to efficiently select the next vertex with the smallest distance.

**Ours**

Which data structure does Dijkstra's shortest-path algorithm use to pick the next closest vertex?

- ✅ Priority Queue
- ▫️ Hash set
- ▫️ String
- ▫️ Stack

> Dijkstra's algorithm, which is used to find the shortest path in a graph, typically employs a priority queue to efficiently select the next vertex with the smallest distance.

---

### `cs-fcc-017` (general-cs-quiz.ts #17)

- [ ] Checked by us

*Why:* Selection sort is also O(n^2) in its best and worst case.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

Which of the following sorting algorithms has the same best-case and worst-case time complexities?

- ✅ Merge Sort
- ▫️ Bubble Sort
- ▫️ Quick Sort
- ▫️ Selection sort

> Merge sort has a time complexity of O(nlogn) in all cases - best, average and worst.

**Ours**

Which of the following sorting algorithms has the same best-case and worst-case time complexities?

- ▫️ Insertion Sort
- ▫️ Bubble Sort
- ▫️ Quick Sort
- ✅ Merge Sort

> Merge sort has a time complexity of O(nlogn) in all cases - best, average and worst.

---

### `cs-fcc-022` (general-cs-quiz.ts #22)

- [ ] Checked by us

*Why:* Bellman-Ford also detects negative cycles.

*Explanation:* rewritten · *Practicality:* 3

**Original**

Which problems are solved using Bellman Ford's Algorithm?

- ✅ Single Source Shortest Path
- ▫️ All Pair Shortest Path
- ▫️ Negative Cycle Detection
- ▫️ Minimum Spanning Tree

> Bellman Ford's algorithm is a shortest path finding algorithm for graphs that can have negative weights.

**Ours**

Which problems are solved using Bellman Ford's Algorithm?

- ▫️ Maximum Flow
- ▫️ Minimum Spanning Tree
- ▫️ All Pair Shortest Path
- ✅ Single Source Shortest Path

> Bellman-Ford finds single-source shortest paths and, unlike Dijkstra's, works with negative edge weights. It can also detect negative cycles.

---

### `cs-fcc-026` (general-cs-quiz.ts #26)

- [ ] Checked by us

*Why:* The decision version of TSP is NP-complete, so both NP-hard and NP-complete could be right. The prompt now says the optimization version.

*Explanation:* rewritten · *Practicality:* 3

**Original**

Which of the following statements is true for the Traveling salesman problem?

- ✅ It is an NP-Hard problem.
- ▫️ It is an NP-Complete problem.
- ▫️ It is an NP problem.
- ▫️ It is a P problem.

> Traveling salesman problem is an NP-Hard problem.

**Ours**

Which is true of the optimization version of the Traveling Salesman Problem (find the shortest tour)?

- ✅ It is an NP-Hard problem.
- ▫️ It is an NP-Complete problem.
- ▫️ It is a P problem.
- ▫️ It is an NP problem.

> Finding the shortest tour is NP-hard. The decision version ("is there a tour shorter than k?") is NP-complete.

---

### `cs-fcc-183` (general-cs-quiz.ts #183)

- [ ] Checked by us

*Why:* Defining methods with the same name but different implementations (overloading/overriding) is also polymorphism.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 4

**Original**

What is polymorphism in the context of object-oriented programming?

- ✅ The ability of different objects to respond uniquely to the same method call
- ▫️ The process of defining a new class based on an existing class
- ▫️ The concept of hiding the internal state of an object
- ▫️ The ability to create multiple methods with the same name but different implementations

> Polymorphism is an object-oriented programming principle that allows objects of different classes to be treated as objects of a common super class. It enables a single method to behave differently based on the object that it is acting upon.

**Ours**

What is polymorphism in the context of object-oriented programming?

- ✅ The ability of different objects to respond uniquely to the same method call
- ▫️ The process of defining a new class based on an existing class
- ▫️ The concept of hiding the internal state of an object
- ▫️ The ability to copy an object's state into a new object

> Polymorphism is an object-oriented programming principle that allows objects of different classes to be treated as objects of a common super class. It enables a single method to behave differently based on the object that it is acting upon.

---

### `js-fcc-010` (javascript-quiz.ts #10)

- [ ] Checked by us

*Why:* every() also calls a callback for each element (until one fails).

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

In JavaScript, which method uses a callback function for each element in the array?

- ✅ forEach()
- ▫️ every(
- ▫️ forEvery()
- ▫️ each()

> The forEach() method uses a callback function for each element in the array.

**Ours**

Which method uses a callback function for each element in the array?

- ▫️ forEvery()
- ▫️ forAll()
- ✅ forEach()
- ▫️ each()

> The forEach() method uses a callback function for each element in the array.

---

### `js-fcc-013` (javascript-quiz.ts #13)

- [ ] Checked by us

*Why:* Type casting is also converting a type. The prompt now asks about automatic conversion (coercion).

*Explanation:* rewritten · *Practicality:* 5

**Original**

What is the process of converting a value from one data type to another called?

- ✅ Type Coercion
- ▫️ Type Casting
- ▫️ Data Converting
- ▫️ Change Value

> Type coercion is the process of converting a value from one type to another (such as a string to number, object to boolean, and so on).

**Ours**

What is it called when JavaScript converts a value's type automatically, as in '5' * 2?

- ▫️ Type casting
- ▫️ Data converting
- ✅ Type Coercion
- ▫️ Type inference

> Type coercion is the implicit conversion of a value from one type to another: '5' * 2 turns '5' into the number 5. Converting on purpose, with Number('5'), is explicit conversion.

---

### `js-fcc-126` (javascript-quiz.ts #126)

- [ ] Checked by us

*Why:* clearTimeout() also cancels a setInterval(); browsers share one ID pool for both.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

In JavaScript, which method allows you to cancel a repeated action created with setInterval()?

- ✅ clearInterval
- ▫️ clearImmediate
- ▫️ clearTimeout
- ▫️ stopInterval

> This clearInterval() method is used to stop the timed loop that was started by the setInterval() method.

**Ours**

Which method allows you to cancel a repeated action created with setInterval()?

- ▫️ stopInterval
- ▫️ clearImmediate
- ▫️ cancelInterval
- ✅ clearInterval

> This clearInterval() method is used to stop the timed loop that was started by the setInterval() method.

---

### `js-fcc-160` (javascript-quiz.ts #160)

- [ ] Checked by us

*Why:* Bubbling is a kind of event propagation, so "Event propagation" was also right.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

In JavaScript, what is it called when an event is triggered on a target element and subsequent parent elements?

- ✅ Event bubbling
- ▫️ Event propagation
- ▫️ Event capturing
- ▫️ Event handling

> Event bubbling is an event propagation method that starts with the element that triggered the event and then bubbles up to its parent elements in their respective hierarchy.

**Ours**

What is it called when an event is triggered on a target element and subsequent parent elements?

- ▫️ Event capturing
- ▫️ Event delegation
- ✅ Event bubbling
- ▫️ Event handling

> Event bubbling is an event propagation method that starts with the element that triggered the event and then bubbles up to its parent elements in their respective hierarchy.

---

### `js-fcc-164` (javascript-quiz.ts #164)

- [ ] Checked by us

*Why:* entries() also returns a new array iterator.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

In JavaScript, which array method returns a new iterable iterator object?

- ✅ values()
- ▫️ concat()
- ▫️ entries()
- ▫️ sort()

> The array.values() method returns a new array iterator. To access each element in that new array iterator, you can use a for...of loop.

**Ours**

Which array method returns a new iterable iterator object?

- ▫️ sort()
- ▫️ forEach()
- ▫️ concat()
- ✅ values()

> The array.values() method returns a new array iterator. To access each element in that new array iterator, you can use a for...of loop.

---

### `js-fcc-185` (javascript-quiz.ts #185)

- [ ] Checked by us

*Why:* Several awaits on one line (await a + await b) is valid, so that "wrong" option was true.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 7

**Original**

In JavaScript, which of the following statements is correct regarding async await?

- ✅ async automatically returns a promise
- ▫️ await keeps executing code regardless of promise status
- ▫️ async can be used independently without an async function
- ▫️ Multiple await keywords can be used in a single line inside an async function

> Declaring an asynchronous function generates an AsyncFunction object. Whenever this async function is invoked, it produces a fresh Promise. This Promise will either resolve with the value returned by the async function or reject if there's an uncaught exception within the async function.

**Ours**

Which of the following statements is correct regarding async await?

- ▫️ await keeps executing code regardless of promise status
- ▫️ An async function blocks the thread until it finishes
- ▫️ await can be used in any regular function
- ✅ An async function always returns a promise

> Declaring an asynchronous function generates an AsyncFunction object. Whenever this async function is invoked, it produces a fresh Promise. This Promise will either resolve with the value returned by the async function or reject if there's an uncaught exception within the async function.

---

### `js-fcc-191` (javascript-quiz.ts #191)

- [ ] Checked by us

*Why:* Date('2023-10-25') without new returns a string, which is a primitive.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 4

**Original**

Which one of the following is considered a primitive value in JavaScript?

- ✅ 3.14
- ▫️ [1, 4, 9, 16]
- ▫️ function add(x, y) { return x + y; }
- ▫️ Date('2023-10-25')

> There are 7 primitive data types in JavaScript: strings, numbers, booleans, null, undefined, Symbol, and BigInt. Everything else is a JavaScript object including arrays, sets, functions, dates, etc.

**Ours**

Which one of the following is considered a primitive value?

- ▫️ function add(x, y) { return x + y; }
- ▫️ new Date('2023-10-25')
- ✅ 3.14
- ▫️ [1, 4, 9, 16]

> There are 7 primitive data types in JavaScript: strings, numbers, booleans, null, undefined, Symbol, and BigInt. Everything else is a JavaScript object including arrays, sets, functions, dates, etc.

---

## 3. Duplicate or broken options (4)

Two options were identical, so I replaced one.

### `python-fcc-024` (python-quiz.ts #24)

- [ ] Checked by us

*Why:* Options had 0 twice.

*Explanation:* rewritten · *Practicality:* 7

**Original**

What will be the output of following code 2//4?

- ✅ 0
- ▫️ 0.5
- ▫️ 0
- ▫️ 2

> The division of operands where the result is the quotient in which the digits after the decimal point are removed

**Ours**

What does this evaluate to?

```
2 // 4
```

- ▫️ 2
- ✅ 0
- ▫️ 0.5
- ▫️ 0.0

> // is floor division: it divides and rounds down to a whole number. 2 / 4 is 0.5, so 2 // 4 is 0 (an int, since both operands are ints).

---

### `python-fcc-029` (python-quiz.ts #29)

- [ ] Checked by us

*Why:* Options had (30, 40, 50) twice.

*Explanation:* rewritten · *Practicality:* 8

**Original**

What is the output of the following Python code: print((10, 20, 30, 40, 50, 60, 70, 80)[2:5])?

- ✅ (30, 40, 50)
- ▫️ (10, 30 ,40, 50)
- ▫️ (30, 40, 50)
- ▫️ (10, 20, 30)

> To get a sub tuple out of the Tuple, we need to specify the range of indexes. We need to specify where to start and where to end the range.

**Ours**

What does this print?

```
print((10, 20, 30, 40, 50, 60, 70, 80)[2:5])
```

- ✅ (30, 40, 50)
- ▫️ (30, 40, 50, 60)
- ▫️ (10, 20, 30)
- ▫️ (20, 30, 40)

> A slice [2:5] starts at index 2 and stops before index 5, so it takes indexes 2, 3 and 4: (30, 40, 50).

---

### `python-fcc-030` (python-quiz.ts #30)

- [ ] Checked by us

*Why:* Options had (100,100) twice.

*Explanation:* rewritten · *Practicality:* 5

**Original**

What is the output of the following Tuple Operation in Python: print((100,) * 2)?

- ✅ (100,100)
- ▫️ (200)
- ▫️ (100)
- ▫️ (100,100)

> We can use * operator to repeat the tuple values n number of times.

**Ours**

What does this print?

```
print((100,) * 2)
```

- ✅ (100, 100)
- ▫️ (200,)
- ▫️ 200
- ▫️ ((100,), (100,))

> * repeats a tuple's items. (100,) is a one-item tuple (the comma makes it a tuple), so (100,) * 2 is (100, 100).

---

### `cs-fcc-174` (general-cs-quiz.ts #174)

- [ ] Checked by us

*Why:* Options had O(E log V) twice.

*Explanation:* rewritten · *Practicality:* 2

**Original**

What is the time complexity of Kruskal's algorithm in terms of the number of edges (E) and vertices (V) in the graph?

- ✅ O(E log V)
- ▫️ O(E)
- ▫️ O(E log V)
- ▫️ O(V log E)

> E is at most O(V^2) in a complete graph, and log(V^2) is equivalent to 2 * log(V), the time complexity is often expressed as O(E log V). This is because, in most cases, E is significantly smaller than V^2, and it simplifies to O(E log V).

**Ours**

What is the time complexity of Kruskal's algorithm in terms of the number of edges (E) and vertices (V) in the graph?

- ✅ O(E log V)
- ▫️ O(V log E)
- ▫️ O(V^2)
- ▫️ O(E)

> Kruskal's algorithm sorts the edges (O(E log E)) and uses union-find to join components. Since E is at most V^2, log E is at most 2 log V, so this is usually written O(E log V).

---

## 4. Question reworded: ambiguous, outdated or false premise (24)

The answer is the same idea; the question or options were fixed so it has one defensible answer.

### `python-fcc-002` (python-quiz.ts #2)

- [ ] Checked by us

*Why:* Asked about trailing whitespace, but strip() removes both ends (rstrip() is trailing only). Also a typo, "removesapce()".

*Explanation:* rewritten · *Practicality:* 8

**Original**

In Python, which method is used to trim trailing whitespace from a string?

- ✅ strip()
- ▫️ trim()
- ▫️ remove()
- ▫️ removesapce()

> Python has three built-in methods for trimming leading and trailing whitespace and characters from strings: strip(), lstrip(), rstrip()

**Ours**

Which method removes whitespace from both ends of a string?

- ▫️ remove()
- ▫️ chomp()
- ▫️ trim()
- ✅ strip()

> strip() removes leading and trailing whitespace (or the characters you pass it). lstrip() and rstrip() do one end only.
> 
> '  hi  '.strip()    # 'hi'
> '  hi  '.rstrip()   # '  hi'

---

### `python-fcc-050` (python-quiz.ts #50)

- [ ] Checked by us

*Why:* Curly quotes made it invalid Python; the answer is now the actual value.

*Explanation:* rewritten · *Practicality:* 5

**Original**

In Python, what is the result of this code: “Hi” * 2?

- ✅ HiHi
- ▫️ “Hihi”
- ▫️ “HiHiHiHi”
- ▫️ A SyntaxError

> The * operator in Python can be used to repeat a string a given number of times. In this case, the string “Hi” is repeated two times. 

**Ours**

What does this evaluate to?

```
'Hi' * 2
```

- ▫️ A TypeError
- ✅ 'HiHi'
- ▫️ 'Hi2'
- ▫️ 'HiHiHiHi'

> * with a string and an int repeats the string: 'Hi' * 2 is 'HiHi'.

---

### `python-fcc-095` (python-quiz.ts #95)

- [ ] Checked by us

*Why:* Keys must be hashable, not strictly immutable (a tuple holding a list is immutable but unhashable).

*Explanation:* rewritten · *Practicality:* 7

**Original**

In Python, the keys of a dictionary must be...

- ✅ Immutable
- ▫️ Mutable
- ▫️ Both will work
- ▫️ Neither will work

> The keys of a Python dictionary must be immutable.

**Ours**

The keys of a dictionary must be...

- ▫️ Strings only
- ▫️ Mutable
- ▫️ Either; any value works
- ✅ Hashable (in practice, immutable types like str, int and tuple)

> Dictionary keys must be hashable, so their hash can't change while they're in the dict. str, int and tuples of hashable values work; a list or dict as a key raises TypeError: unhashable type.

---

### `python-fcc-118` (python-quiz.ts #118)

- [ ] Checked by us

*Why:* The answer was "__init__", not "__init__.py". Since Python 3.3, namespace packages also work without the file.

*Explanation:* rewritten · *Practicality:* 5

**Original**

In Python, which file is compulsory to create a package?

- ✅ __init__
- ▫️ __main__
- ▫️ main.py
- ▫️ __package__

> We cannot create a Python package without adding a __init__.py file, This file will tell Python to treat directories as modules.

**Ours**

Which file marks a directory as a regular Python package?

- ▫️ main.py
- ✅ __init__.py
- ▫️ __package__.py
- ▫️ __main__.py

> __init__.py marks a directory as a regular package and runs when the package is imported. Since Python 3.3, a directory without one can still be imported as a namespace package. __main__.py is what python -m package runs.

---

### `python-fcc-126` (python-quiz.ts #126)

- [ ] Checked by us

*Why:* / also can't be used with strings, so two options were right. Rephrased.

*Explanation:* rewritten · *Practicality:* 4

**Original**

What arithmetic operators cannot be used with strings in Python?

- ✅ -
- ▫️ +
- ▫️ /
- ▫️ *

> + is used to concatenate and * is used to multiply strings

**Ours**

Which of these operators never works with a string operand?

- ▫️ *
- ✅ -
- ▫️ +
- ▫️ %

> + concatenates two strings, * repeats a string (with an int), and % formats one ('%s!' % 'hi'). - has no string meaning: 'ab' - 'b' raises TypeError.

---

### `python-fcc-146` (python-quiz.ts #146)

- [ ] Checked by us

*Why:* The marked answer showed one set order, but set order is not guaranteed.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In Python, what is the expected output for print({'apple', 'orange', 'apple', 'pear', 'orange', 'banana'}) ?

- ✅ {'orange', 'banana', 'pear', 'apple'}
- ▫️ {'orange', 'banana', 'pear', 'apple', 'apple', 'orange'}
- ▫️ {'orange', 'banana', 'pear', 'apple', 'orange', 'apple'}
- ▫️ {'orange', 'banana', 'pear', 'apple', 'orange', 'apple', 'apple', 'orange'}

> print({'apple', 'orange', 'apple', 'pear', 'orange', 'banana'}) would return a set of unordered unique items.

**Ours**

What does this print?

```
print({'apple', 'orange', 'apple', 'pear', 'orange', 'banana'})
```

- ✅ A set of the 4 distinct strings, in no guaranteed order
- ▫️ TypeError: a set literal cannot have duplicates
- ▫️ A set of all 6 strings, in the order written
- ▫️ A list of the 4 distinct strings, sorted

> A set keeps one copy of each item, so the duplicates collapse to apple, orange, pear and banana. Sets are unordered: the printed order depends on string hashing and can change between runs.

---

### `cs-fcc-002` (general-cs-quiz.ts #2)

- [ ] Checked by us

*Why:* Ford-Fulkerson's complexity depends on how paths are found; O(V * E^2) is Edmonds-Karp (BFS).

*Explanation:* unchanged (apart from formatting) · *Practicality:* 2

**Original**

What is the time complexity of the Ford-Fulkerson algorithm?

- ✅ O(V * E ^ 2)
- ▫️ O(V + E)
- ▫️ O(V ^ 2 * E)
- ▫️ O(V ^ 3 * E ^ 2)

> The time complexity of the Ford-Fulkerson algorithm depends on how the augmenting paths are found. If the paths are found using a breadth-first search (BFS), it can lead to the Edmonds-Karp implementation, which has a time complexity of O(V * E ^ 2).

**Ours**

What is the time complexity of the Edmonds-Karp algorithm (Ford-Fulkerson using BFS to find augmenting paths)?

- ▫️ O(V ^ 2 * E)
- ▫️ O(V + E)
- ✅ O(V * E ^ 2)
- ▫️ O(V ^ 3 * E ^ 2)

> The time complexity of the Ford-Fulkerson algorithm depends on how the augmenting paths are found. If the paths are found using a breadth-first search (BFS), it can lead to the Edmonds-Karp implementation, which has a time complexity of O(V * E ^ 2).

---

### `cs-fcc-015` (general-cs-quiz.ts #15)

- [ ] Checked by us

*Why:* "Best algorithm for matrix multiplication" has no single answer, and the explanation said O(2.81) instead of O(n^2.81).

*Explanation:* rewritten · *Practicality:* 2

**Original**

What is the best algorithm for matrix multiplication?

- ✅ Strassen's Algorithm
- ▫️ Multiplication algorithm
- ▫️ Divide and Conquer Technique
- ▫️ None of the above

> Strassen's algorithm reduces the number of multiplication and addition in a given matrix and results in a time complexity of O(2.81)

**Ours**

Which algorithm multiplies two n x n matrices in about O(n^2.81) time?

- ▫️ Kruskal's algorithm
- ✅ Strassen's Algorithm
- ▫️ The schoolbook triple loop
- ▫️ Horner's method

> Strassen's algorithm replaces 8 recursive block multiplications with 7, giving O(n^log2(7)) which is about O(n^2.81). The schoolbook method is O(n^3).

---

### `cs-fcc-019` (general-cs-quiz.ts #19)

- [ ] Checked by us

*Why:* "Bitwise division is faster than /" is a claim compilers make moot. It now asks how to divide by 8 with a shift.

*Explanation:* rewritten · *Practicality:* 4

**Original**

Which of the following is true regarding division and the bitwise operator?

- ✅ Dividing a number by 8 using the bitwise operator is faster than using the / operator
- ▫️ Dividing a number by 8 cannot be implemented using bitwise operator
- ▫️ Dividing a number by 8 using the bitwise operator is slower than using the / operator
- ▫️ none of the following options are true

> When a binary number is shifted to the right 3 times, it will be divided by 8.

**Ours**

How can you divide a non-negative integer x by 8 with a bitwise operator?

- ✅ x >> 3
- ▫️ x ^ 8
- ▫️ x << 3
- ▫️ x & 8

> Shifting right by one bit halves a non-negative integer (rounding down), so shifting right by 3 divides by 2^3 = 8. Compilers already do this for you; write x / 8 unless you need the bits.

---

### `cs-fcc-029` (general-cs-quiz.ts #29)

- [ ] Checked by us

*Why:* "Edge weight lookup is O(E)" is imprecise; it is O(degree of the node).

*Explanation:* rewritten · *Practicality:* 4

**Original**

Which of the following is true for an adjacency list?

- ✅ Edge weight lookup is O(E).
- ▫️ Edge weight lookup is O(1).
- ▫️ Edge weight cannot be specified in adjacency list.
- ▫️ It cannot be used to represent a cyclic graph.

> In an adjacency list, for each node only adjacent nodes are stored in a list

**Ours**

Which of the following is true for an adjacency list?

- ✅ Looking up an edge takes time proportional to the node's degree, not O(1).
- ▫️ It cannot be used to represent a cyclic graph.
- ▫️ Edge weight lookup is O(1).
- ▫️ Edge weight cannot be specified in adjacency list.

> An adjacency list stores each node's neighbours in a list, so finding a particular edge means scanning that list. An adjacency matrix answers it in O(1) but uses O(V^2) space.

---

### `cs-fcc-042` (general-cs-quiz.ts #42)

- [ ] Checked by us

*Why:* "Merge sort is faster on large datasets" is false in practice (quicksort usually wins). Now asks which one guarantees O(n log n).

*Explanation:* rewritten · *Practicality:* 6

**Original**

Between Merge sort and Quicksort, which sorting algorithm works faster in the case of larger datasets?

- ✅ Merge sort
- ▫️ testing on speed between the two algorithms has been inconclusive on which one is faster
- ▫️ Quicksort
- ▫️ Both

> Merge sort runs quicker than Quick sort in the case of larger datasets.

**Ours**

Between merge sort and quicksort, which guarantees O(n log n) even in the worst case?

- ▫️ Both
- ✅ Merge sort
- ▫️ Neither
- ▫️ Quicksort

> Merge sort is O(n log n) in every case. Quicksort is O(n log n) on average and usually faster in practice, but O(n^2) in the worst case (consistently bad pivots).

---

### `cs-fcc-116` (general-cs-quiz.ts #116)

- [ ] Checked by us

*Why:* The answer "A compression algorithm" did not say what lossy means.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

What is Lossy compression?

- ✅ A compression algorithm
- ▫️ An algorithm to reduce file names
- ▫️ A reverse algorithm
- ▫️ A sorting algorithm

> Lossy compression permits reconstruction only of an approximation of the original data.

**Ours**

What is Lossy compression?

- ▫️ A sorting algorithm
- ▫️ An algorithm to reduce file names
- ✅ Compression that discards some data, so only an approximation can be restored
- ▫️ A reverse algorithm

> Lossy compression permits reconstruction only of an approximation of the original data.

---

### `cs-fcc-138` (general-cs-quiz.ts #138)

- [ ] Checked by us

*Why:* Big Theta is a tight bound, not "a range between lower and upper bounds".

*Explanation:* rewritten · *Practicality:* 4

**Original**

What is Big Theta notation?

- ✅ A range between the lower and upper bounds of an algorithm's performance
- ▫️ The lower bound of an algorithm's performance
- ▫️ The upper bound of an algorithm's performance
- ▫️ The average case for an algorithm's performance

> Big theta is either the exact performance value of the algorithm, or a useful range between narrow upper and lower bounds.

**Ours**

What is Big Theta notation?

- ✅ A tight bound: growth bounded above and below by the same function
- ▫️ Only the lower bound of an algorithm's performance
- ▫️ Only the upper bound of an algorithm's performance
- ▫️ The average case for an algorithm's performance

> Θ(f(n)) means the running time is both O(f(n)) and Ω(f(n)): it grows at the same rate as f(n), up to constant factors.

---

### `js-fcc-034` (javascript-quiz.ts #34)

- [ ] Checked by us

*Why:* Top-level this is window only in a classic browser script (undefined in modules, module.exports in Node). The source's explanation said it is window everywhere.

*Explanation:* rewritten · *Practicality:* 5

**Original**

In JavaScript, in the global execution context, 'this' refers to the ______ object whether in strict mode or not.

- ✅ window
- ▫️ null
- ▫️ undefined
- ▫️ document

> In the global execution context, the 'this' keyword always points to the window object

**Ours**

In a browser script (not a module), what does 'this' refer to at the top level?

- ▫️ undefined
- ✅ window
- ▫️ document
- ▫️ null

> At the top level of a classic browser script, this is the global object, window, in strict mode or not. In an ES module it is undefined, and in a Node CommonJS file it is module.exports.

---

### `js-fcc-076` (javascript-quiz.ts #76)

- [ ] Checked by us

*Why:* document.createElement() creates an element but does not add it to the DOM.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In JavaScript, what is the name of the method used to add new elements to the DOM tree?

- ✅ document.createElement()
- ▫️ Callback function
- ▫️ .querySelectorAll()
- ▫️ .textContent()

> The document.createElement() method is used to add new elements to the DOM tree.

**Ours**

Which method creates a new element, ready to be inserted into the page?

- ▫️ .querySelectorAll()
- ▫️ Callback function
- ▫️ .textContent()
- ✅ document.createElement()

> document.createElement('div') creates an element that isn't in the page yet; you add it with append(), prepend() or insertBefore().

---

### `js-fcc-120` (javascript-quiz.ts #120)

- [ ] Checked by us

*Why:* Prompt was garbled ("when an operator value is NULL"); typeof returns lowercase strings.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In JavaScript, when an operator value is NULL, the typeof returned by the operator is:

- ✅ Object
- ▫️ Undefined
- ▫️ Integer
- ▫️ Boolean

> In JavaScript, typeof null is an object. This result of typeof null is actually a bug in the language.

**Ours**

What does typeof null return?

- ✅ "object"
- ▫️ "null"
- ▫️ "undefined"
- ▫️ "number"

> typeof null is "object", a bug kept since the first version of JavaScript for compatibility. To check for null, compare directly: value === null.

---

### `js-fcc-121` (javascript-quiz.ts #121)

- [ ] Checked by us

*Why:* typeof returns lowercase strings ("object", not "Object").

*Explanation:* rewritten · *Practicality:* 7

**Original**

In JavaScript, what will 'typeof []' return?

- ✅ Object
- ▫️ Null
- ▫️ Array
- ▫️ Undefined

> In JavaScript, everything that is not a primitive value is an object.

**Ours**

What does typeof [] return?

- ▫️ "array"
- ✅ "object"
- ▫️ "null"
- ▫️ "undefined"

> Arrays are objects, so typeof [] is "object". Use Array.isArray(value) to check for an array.

---

### `js-fcc-122` (javascript-quiz.ts #122)

- [ ] Checked by us

*Why:* typeof returns lowercase strings ("number", not "Number").

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

In JavaScript, what will 'typeof NaN' return?

- ✅ Number
- ▫️ ReferenceError
- ▫️ Null
- ▫️ NaN

> In JavaScript, NaN (not-a-number) is still a numeric data type, but it is undefined as a real number.

**Ours**

What does typeof NaN return?

- ▫️ "undefined"
- ✅ "number"
- ▫️ "NaN"
- ▫️ ReferenceError

> In JavaScript, NaN (not-a-number) is still a numeric data type, but it is undefined as a real number.

---

### `js-fcc-123` (javascript-quiz.ts #123)

- [ ] Checked by us

*Why:* The prompt did not say a was undeclared; options were capitalised.

*Explanation:* rewritten · *Practicality:* 5

**Original**

In JavaScript, what will the following code return: typeof a?

- ✅ undefined
- ▫️ string
- ▫️ object
- ▫️ number

> In JavaScript, if you use the typeof operator on an undeclared variable then it will return undefined. 

**Ours**

What does typeof a return if a was never declared?

- ▫️ ReferenceError
- ✅ "undefined"
- ▫️ "object"
- ▫️ "string"

> typeof is the one place you can use an undeclared name without a ReferenceError: it returns "undefined". (Inside a let or const temporal dead zone, though, it does throw.)

---

### `js-fcc-132` (javascript-quiz.ts #132)

- [ ] Checked by us

*Why:* The answer said there are 6 falsy values; modern JS has 8 (adds -0 and 0n). Now asks which value is truthy.

*Explanation:* rewritten · *Practicality:* 8

**Original**

In JavaScript, how many falsy values are there?

- ✅ 6
- ▫️ 5
- ▫️ 7
- ▫️ 8

> There are 6 falsy values in JavaScript: false, 0, '', null, undefined, and NaN.

**Ours**

Which of these values is truthy?

- ▫️ 0
- ▫️ '' (the empty string)
- ▫️ NaN
- ✅ '0' (the string)

> Any non-empty string is truthy, including '0' and 'false'. The falsy values are false, 0, -0, 0n, '', null, undefined and NaN.

---

### `js-fcc-137` (javascript-quiz.ts #137)

- [ ] Checked by us

*Why:* Every option was a near-tautology ("a function expression is defined using a function expression"). Rewritten around hoisting.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In JavaScript, what is the difference between a function declaration and a function expression?

- ✅ A function declaration is a function that is defined using the function keyword. A function expression is a function that is defined using a function expression.
- ▫️ A function declaration is a function that is defined using a function expression. A function expression is a function that is defined using the function keyword.
- ▫️ A function declaration is a function that is defined using the function keyword. A function expression is a function that is defined using a function declaration.
- ▫️ A function declaration is a function that is defined using a function expression. A function expression is a function that is defined using a function declaration.

> The main difference between a function declaration and a function expression is the function name, which can be omitted in function expressions to create anonymous functions. 

**Ours**

What is the key difference between a function declaration and a function expression?

- ▫️ Only a declaration can be anonymous
- ✅ A declaration is hoisted with its body, so it can be called before the line that defines it; an expression cannot
- ▫️ Only an expression can take parameters
- ▫️ An expression is hoisted with its body; a declaration is not

> function f() {} is hoisted whole, so f() works above it. const f = function () {} only exists after that line runs; calling it earlier throws.

---

### `js-fcc-179` (javascript-quiz.ts #179)

- [ ] Checked by us

*Why:* forEach() takes 2 parameters (callback, thisArg); its callback receives 3. The prompt now asks about the callback.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In JavaScript, how many parameters does the forEach() method take?

- ✅ 3
- ▫️ 1
- ▫️ 2
- ▫️ 4

> The forEach() method takes 3 parameters: the current value, the index, and the array.

**Ours**

How many arguments does forEach() pass to its callback?

- ▫️ 2
- ✅ 3
- ▫️ 4
- ▫️ 1

> forEach calls the callback with 3 arguments: the current value, its index, and the array.

---

### `js-fcc-180` (javascript-quiz.ts #180)

- [ ] Checked by us

*Why:* Same as above: reduce() takes 2 parameters; its callback receives 4.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In JavaScript, how many parameters does the reduce() method take?

- ✅ 4
- ▫️ 1
- ▫️ 2
- ▫️ 3

> The reduce() method takes 4 parameters: the accumulator, the current value, the index, and the array.

**Ours**

How many arguments does reduce() pass to its callback?

- ▫️ 2
- ▫️ 1
- ▫️ 3
- ✅ 4

> reduce calls the callback with 4 arguments: the accumulator, the current value, its index, and the array.

---

### `js-fcc-189` (javascript-quiz.ts #189)

- [ ] Checked by us

*Why:* Session cookies are not "created and managed by JavaScript"; they are cookies without an expiry.

*Explanation:* rewritten · *Practicality:* 4

**Original**

Which type of web cookies are created and managed by JavaScript, and are often used for temporary data storage?

- ✅ Session cookies.
- ▫️ Persistent cookies.
- ▫️ Secure cookies.
- ▫️ Third-party cookies.

> Session cookies are created and managed by JavaScript and are typically used for temporary data storage during a user's session.

**Ours**

Which type of cookie is deleted when the browser session ends?

- ✅ Session cookies.
- ▫️ Persistent cookies.
- ▫️ Secure cookies.
- ▫️ Third-party cookies.

> A session cookie has no Expires or Max-Age attribute, so the browser deletes it when the session ends. A persistent cookie lasts until its expiry date.

---

## 5. Explanation was wrong (answer unchanged) (11)

### `python-fcc-007` (python-quiz.ts #7)

- [ ] Checked by us

*Why:* Said ^ is bitwise NOT; it is XOR.

*Explanation:* rewritten · *Practicality:* 3

**Original**

In Python, which operator is used to perform Bitwise XOR operations?

- ✅ ^
- ▫️ ~
- ▫️ |
- ▫️ &

> The ^ operator is used in Python to perform Bitwise NOT operations.

**Ours**

Which operator is used to perform Bitwise XOR operations?

- ▫️ ~
- ▫️ &
- ✅ ^
- ▫️ |

> The ^ operator is bitwise XOR: each result bit is 1 where exactly one of the operands has a 1.
> 
> 5 ^ 3   # 6  (0b101 ^ 0b011 = 0b110)

---

### `python-fcc-018` (python-quiz.ts #18)

- [ ] Checked by us

*Why:* Talked about Python 2 longs; in Python 3, 3l is a SyntaxError.

*Explanation:* rewritten · *Practicality:* 2

**Original**

In Python, which of the following is not a complex number?

- ✅ 2 + 3l
- ▫️ 2 + 3j
- ▫️ complex(2, 3)
- ▫️ 2 + 3J

> In Python, the letter 'l' (or L) stands for long and 2 + 3l would not result in a complex number.

**Ours**

Which of the following is not a complex number?

- ✅ 2 + 3l
- ▫️ complex(2, 3)
- ▫️ 2 + 3j
- ▫️ 2 + 3J

> Python 3 has no l suffix: 2 + 3l is a SyntaxError. (In Python 2, l or L marked a long integer.) j or J marks the imaginary part, and complex(2, 3) builds 2+3j.

---

### `python-fcc-045` (python-quiz.ts #45)

- [ ] Checked by us

*Why:* Ended with "Canonical is a software company", which is unrelated.

*Explanation:* rewritten · *Practicality:* 2

**Original**

The canonical implementation of the Python programming language, as distributed on python.org is known as...

- ✅ CPython
- ▫️ PPython
- ▫️ QPython
- ▫️ MPython

> CPython is the canonical implementation of the Python programming language, as distributed on python.org. Canonical is a software company

**Ours**

The canonical implementation of the Python programming language, as distributed on python.org is known as...

- ▫️ QPython
- ✅ CPython
- ▫️ PPython
- ▫️ MPython

> CPython is the reference implementation of Python, written in C and distributed on python.org. Others include PyPy and Jython.

---

### `python-fcc-017` (python-quiz.ts #17)

- [ ] Checked by us

*Why:* Did not mention that pop() also removes the item.

*Explanation:* rewritten · *Practicality:* 7

**Original**

In Python, which one is the correct way to get the last item for the following list: numbers = [1, 2, 3, 4, 5]?

- ✅ All of the above
- ▫️ numbers[-1]
- ▫️ numbers[len(numbers)-1]
- ▫️ numbers.pop()

> If you use negative indexing or the pop() method it will return the last item in the numbers list.

**Ours**

Which one is the correct way to get the last item for the following list: numbers = [1, 2, 3, 4, 5]?

- ▫️ numbers.pop()
- ▫️ numbers[len(numbers)-1]
- ▫️ numbers[-1]
- ✅ All of the above

> All three get the last item. numbers[-1] and numbers[len(numbers)-1] read it; numbers.pop() also removes it from the list.

---

### `cs-fcc-137` (general-cs-quiz.ts #137)

- [ ] Checked by us

*Why:* Said Banker's algorithm is used in banking systems; it is an OS deadlock-avoidance algorithm.

*Explanation:* rewritten · *Practicality:* 2

**Original**

In Banker's algorithm, which part of the computer represents the 'Banker'?

- ✅ Operating System
- ▫️ RAM
- ▫️ CPU
- ▫️ Register

> Banker's algorithm is most commonly used within banking systems to help determine if resources are available to lend to customers. The operating system represents the 'Banker' because it decides the resource allocation.

**Ours**

In Banker's algorithm, which part of the computer represents the 'Banker'?

- ▫️ RAM
- ▫️ Register
- ▫️ CPU
- ✅ Operating System

> Banker's algorithm is a deadlock-avoidance algorithm: the operating system, like a banker, grants a process's request for resources only if every process can still finish afterwards.

---

### `js-fcc-024` (javascript-quiz.ts #24)

- [ ] Checked by us

*Why:* Was about clearing an array with length = 0 (copied from another question).

*Explanation:* rewritten · *Practicality:* 5

**Original**

In JavaScript, every class has a special ____________ method that is used to create a new object instance of the class.

- ✅ constructor
- ▫️ starter
- ▫️ assign
- ▫️ apply

> Assigning 0 to the length property of the array will clear the contents of the array.

**Ours**

Every class has a special ____________ method that is used to create a new object instance of the class.

- ▫️ apply
- ▫️ assign
- ✅ constructor
- ▫️ starter

> constructor is the special method a class runs when you create an instance with new. It sets up the new object's fields.
> 
> class Point {
>   constructor(x, y) { this.x = x; this.y = y; }
> }
> new Point(1, 2)   // Point { x: 1, y: 2 }

---

### `js-fcc-025` (javascript-quiz.ts #25)

- [ ] Checked by us

*Why:* Said objects are only ever created from classes; JS objects often are not.

*Explanation:* rewritten · *Practicality:* 3

**Original**

In JavaScript class-based OOP, are objects and classes the same constructs?

- ✅ No, objects and classes are two separate constructs.
- ▫️ No, objects and classes are completely unrelated in JavaScript.
- ▫️ Yes, objects and classes are only used in functional programming, not in JavaScript class-based OOP
- ▫️ Yes, objects and classes are interchangeable and can be used interchangeably in JavaScript class-based OOP.

> Classes and objects represent distinct concepts within programming.  Objects are exclusively instantiated from classes.

**Ours**

In class-based OOP, are objects and classes the same constructs?

- ▫️ No, objects and classes are completely unrelated in JavaScript.
- ▫️ Yes, objects and classes are only used in functional programming, not in JavaScript class-based OOP
- ▫️ Yes, objects and classes are interchangeable and can be used interchangeably in JavaScript class-based OOP.
- ✅ No, objects and classes are two separate constructs.

> A class is a template; an object is an instance created from it with new. (In JavaScript, objects can also be created without classes, from literals or Object.create.)

---

### `js-fcc-142` (javascript-quiz.ts #142)

- [ ] Checked by us

*Why:* Said at() returns the index; it returns the element.

*Explanation:* rewritten · *Practicality:* 6

**Original**

In JavaScript, what array method takes an integer value and returns the element at that index?

- ✅ .at()
- ▫️ .value()
- ▫️ .flat()
- ▫️ .some()

> The at() method takes a positive or negative integer and returns the index for that element.

**Ours**

What array method takes an integer value and returns the element at that index?

- ▫️ .value()
- ▫️ .flat()
- ▫️ .some()
- ✅ .at()

> at() takes a positive or negative index and returns the element there. Negative counts from the end: arr.at(-1) is the last element.

---

### `js-fcc-177` (javascript-quiz.ts #177)

- [ ] Checked by us

*Why:* Defined a composite type as "not being an object", which is backwards.

*Explanation:* rewritten · *Practicality:* 3

**Original**

In JavaScript, which of the following is NOT a composite data type?

- ✅ String
- ▫️ Array
- ▫️ Class
- ▫️ Object

> In JavaScript, a composite data type is defined as not being an object as well as having no properties or methods.

**Ours**

Which of the following is NOT a composite data type?

- ▫️ Array
- ✅ String
- ▫️ Object
- ▫️ Class

> A string is a primitive value. Arrays, objects and class instances are composite: they hold other values.

---

### `js-fcc-183` (javascript-quiz.ts #183)

- [ ] Checked by us

*Why:* Said only objects and arrays are changeable, conflating variables with values.

*Explanation:* rewritten · *Practicality:* 2

**Original**

In JavaScript, what is the name for a variable that can be changed?

- ✅ Mutable Variable
- ▫️ Volatile Variable
- ▫️ Dynamic Variable
- ▫️ Fluid Variable

> Variables that can have their values changed are referred to as Mutable Variables. Only objects and arrays are changeable in JavaScript; primitive values are not.

**Ours**

What is the name for a variable that can be changed?

- ▫️ Volatile Variable
- ✅ Mutable Variable
- ▫️ Fluid Variable
- ▫️ Dynamic Variable

> A variable you can reassign is often called mutable. let and var declare reassignable variables; const does not.

---

### `js-lydia-014` (lydiahallie/javascript-questions #14)

- [ ] Checked by us

*Why:* The original explanation was incorrect (it called objects created by the user or with new "the base object"). The question was also reworded to 4 options.

*Explanation:* rewritten · *Practicality:* 3

**Original**

All object have prototypes.

- ▫️ true
- ✅ false

> All objects have prototypes, except for the **base object**. The base object is the object created by the user, or an object that is created using the `new` keyword. The base object has access to some methods and properties, such as `.toString`. This is the reason why you can use built-in JavaScript methods! All of such methods are available on the prototype. Although JavaScript can't find it directly on your object, it goes down the prototype chain and finds it there, which makes it accessible for you.

**Ours**

Do all objects have prototypes?

- ▫️ Yes, every object has one
- ✅ No: Object.prototype itself, and objects made with Object.create(null), have none
- ▫️ No: only objects created with new have one
- ▫️ No: only class instances have one

> Almost every object has a prototype it inherits from: object literals inherit from Object.prototype, arrays from Array.prototype, and so on. That chain is why built-in methods like .toString() work on objects you create.
> 
>     Object.getPrototypeOf({}) === Object.prototype   // true
>     Object.getPrototypeOf(Object.prototype)          // null: the end of the chain
>     Object.getPrototypeOf(Object.create(null))       // null: made with no prototype

---

## 6. lydiahallie questions brought to 4 options or otherwise edited (14)

The answers were right in the source; these show the options, prompt or explanation I changed.

### `js-lydia-072` (lydiahallie/javascript-questions #72)

- [ ] Checked by us

*Why:* Options used HTML line breaks; options rewritten as text and the explanation rewritten (the original relied on Markdown code spans).

*Explanation:* rewritten · *Practicality:* 3

**Original**

What's the output?

```
console.log(String.raw`Hello\nworld`);
```

- ▫️ `Hello world!`
- ▫️ `Hello` <br />&nbsp; &nbsp; &nbsp;`world`
- ✅ `Hello\nworld`
- ▫️ `Hello\n` <br /> &nbsp; &nbsp; &nbsp;`world`

> `String.raw` returns a string where the escapes (`\n`, `\v`, `\t` etc.) are ignored! Backslashes can be an issue since you could end up with something like:
> 
> `` const path = `C:\Documents\Projects\table.html` ``
> 
> Which would result in:
> 
> `"C:DocumentsProjects able.html"`
> 
> With `String.raw`, it would simply ignore the escape and print:
> 
> `C:\Documents\Projects\table.html`
> 
> In this case, the string is `Hello\nworld`, which gets logged.

**Ours**

What's the output?

```
console.log(String.raw`Hello\nworld`);
```

- ▫️ Hello world!
- ▫️ Hello, then world on a new line
- ✅ Hello\nworld
- ▫️ Hello\n on one line, then world on the next

> String.raw returns the raw text of a template literal: escape sequences like \n, \t and \v are not processed. So the string holds a backslash followed by n, not a line break, and that is what gets logged.
> 
>     console.log(`Hello\nworld`)            // Hello, then world on a new line
>     console.log(String.raw`Hello\nworld`)  // Hello\nworld
> 
> Handy for Windows paths: String.raw`C:\Documents\table.html` keeps every backslash.

---

### `js-lydia-048` (lydiahallie/javascript-questions #48)

- [ ] Checked by us

*Why:* Explanation pointed at "question 15"; that pointer was removed.

*Explanation:* edited (a pointer or link removed) · *Practicality:* 6

**Original**

What's the output?

```
console.log(3 + 4 + '5');
```

- ▫️ `"345"`
- ✅ `"75"`
- ▫️ `12`
- ▫️ `"12"`

> Operator associativity is the order in which the compiler evaluates the expressions, either left-to-right or right-to-left. This only happens if all operators have the _same_ precedence. We only have one type of operator: `+`. For addition, the associativity is left-to-right.
> 
> `3 + 4` gets evaluated first. This results in the number `7`.
> 
> `7 + '5'` results in `"75"` because of coercion. JavaScript converts the number `7` into a string, see question 15. We can concatenate two strings using the `+`operator. `"7" + "5"` results in `"75"`.

**Ours**

What's the output?

```
console.log(3 + 4 + '5');
```

- ▫️ "345"
- ✅ "75"
- ▫️ 12
- ▫️ "12"

> Operator associativity is the order in which the compiler evaluates the expressions, either left-to-right or right-to-left. This only happens if all operators have the same precedence. We only have one type of operator: +. For addition, the associativity is left-to-right.
> 
> 3 + 4 gets evaluated first. This results in the number 7.
> 
> 7 + '5' results in "75" because of coercion. JavaScript converts the number 7 into a string. We can concatenate two strings using the +operator. "7" + "5" results in "75".

---

### `js-lydia-051` (lydiahallie/javascript-questions #51)

- [ ] Checked by us

*Why:* Explanation pointed at "question 46"; that pointer was removed.

*Explanation:* edited (a pointer or link removed) · *Practicality:* 7

**Original**

What's the output?

```
function getInfo(member, year) {
  member.name = 'Lydia';
  year = '1998';
}

const person = { name: 'Sarah' };
const birthYear = '1997';

getInfo(person, birthYear);

console.log(person, birthYear);
```

- ✅ `{ name: "Lydia" }, "1997"`
- ▫️ `{ name: "Sarah" }, "1998"`
- ▫️ `{ name: "Lydia" }, "1998"`
- ▫️ `{ name: "Sarah" }, "1997"`

> Arguments are passed by _value_, unless their value is an object, then they're passed by _reference_. `birthYear` is passed by value, since it's a string, not an object. When we pass arguments by value, a _copy_ of that value is created (see question 46).
> 
> The variable `birthYear` has a reference to the value `"1997"`. The argument `year` also has a reference to the value `"1997"`, but it's not the same value as `birthYear` has a reference to. When we update the value of `year` by setting `year` equal to `"1998"`, we are only updating the value of `year`. `birthYear` is still equal to `"1997"`.
> 
> The value of `person` is an object. The argument `member` has a (copied) reference to the _same_ object. When we modify a property of the object `member` has a reference to, the value of `person` will also be modified, since they both have a reference to the same object. `person`'s `name` property is now equal to the value `"Lydia"`

**Ours**

What's the output?

```
function getInfo(member, year) {
  member.name = 'Lydia';
  year = '1998';
}

const person = { name: 'Sarah' };
const birthYear = '1997';

getInfo(person, birthYear);

console.log(person, birthYear);
```

- ✅ { name: "Lydia" }, "1997"
- ▫️ { name: "Sarah" }, "1998"
- ▫️ { name: "Lydia" }, "1998"
- ▫️ { name: "Sarah" }, "1997"

> Arguments are passed by value, unless their value is an object, then they're passed by reference. birthYear is passed by value, since it's a string, not an object. When we pass arguments by value, a copy of that value is created.
> 
> The variable birthYear has a reference to the value "1997". The argument year also has a reference to the value "1997", but it's not the same value as birthYear has a reference to. When we update the value of year by setting year equal to "1998", we are only updating the value of year. birthYear is still equal to "1997".
> 
> The value of person is an object. The argument member has a (copied) reference to the same object. When we modify a property of the object member has a reference to, the value of person will also be modified, since they both have a reference to the same object. person's name property is now equal to the value "Lydia"

---

### `js-lydia-133` (lydiahallie/javascript-questions #133)

- [ ] Checked by us

*Why:* Explanation linked to the author's article; the link was removed.

*Explanation:* edited (a pointer or link removed) · *Practicality:* 6

**Original**

What's the output?

```
const myPromise = Promise.resolve(Promise.resolve('Promise'));

function funcOne() {
  setTimeout(() => console.log('Timeout 1!'), 0);
  myPromise.then(res => res).then(res => console.log(`${res} 1!`));
  console.log('Last line 1!');
}

async function funcTwo() {
  const res = await myPromise;
  console.log(`${res} 2!`)
  setTimeout(() => console.log('Timeout 2!'), 0);
  console.log('Last line 2!');
}

funcOne();
funcTwo();
```

- ▫️ `Promise 1! Last line 1! Promise 2! Last line 2! Timeout 1! Timeout 2!`
- ▫️ `Last line 1! Timeout 1! Promise 1! Last line 2! Promise2! Timeout 2! `
- ✅ `Last line 1! Promise 2! Last line 2! Promise 1! Timeout 1! Timeout 2!`
- ▫️ `Timeout 1! Promise 1! Last line 1! Promise 2! Timeout 2! Last line 2!`

> First, we invoke `funcOne`. On the first line of `funcOne`, we call the _asynchronous_ `setTimeout` function, from which the callback is sent to the Web API. (see my article on the event loop <a href="https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif">here</a>.)
> 
> Then we call the `myPromise` promise, which is an _asynchronous_ operation. Pay attention, that now only the first then clause was added to the microtask queue.
> 
> Both the promise and the timeout are asynchronous operations, the function keeps on running while it's busy completing the promise and handling the `setTimeout` callback. This means that `Last line 1!` gets logged first, since this is not an asynchonous operation. 
> 
> Since the callstack is not empty yet, the `setTimeout` function and promise in `funcOne` cannot get added to the callstack yet.
> 
> In `funcTwo`, the variable `res` gets `Promise` because `Promise.resolve(Promise.resolve('Promise'))` is equivalent to `Promise.resolve('Promise')` since resolving a promise just resolves it's value. The `await` in this line stops the execution of the function until it receives the resolution of the promise and then keeps on running synchronously until completion, so `Promise 2!` and then `Last line 2!` are logged and the `setTimeout` is sent to the Web API. If the first then clause in `funcOne` had its own log statement, it would be printed before `Promise 2!`. Howewer, it executed silently and put the second then clause in microtask queue. So, the second clause will be printed after `Promise 2!`.
> 
> Then the call stack is empty. Promises are _microtasks_ so they are resolved first when the call stack is empty so `Promise 1!` gets to be logged.
> 
> Now, since `funcTwo` popped off the call stack, the call stack is empty. The callbacks waiting in the queue (`() => console.log("Timeout 1!")` from `funcOne`, and `() => console.log("Timeout 2!")` from `funcTwo`) get added to the call stack one by one. The first callback logs `Timeout 1!`, and gets popped off the stack. Then, the second callback logs `Timeout 2!`, and gets popped off the stack.

**Ours**

What's the output?

```
const myPromise = Promise.resolve(Promise.resolve('Promise'));

function funcOne() {
  setTimeout(() => console.log('Timeout 1!'), 0);
  myPromise.then(res => res).then(res => console.log(`${res} 1!`));
  console.log('Last line 1!');
}

async function funcTwo() {
  const res = await myPromise;
  console.log(`${res} 2!`)
  setTimeout(() => console.log('Timeout 2!'), 0);
  console.log('Last line 2!');
}

funcOne();
funcTwo();
```

- ▫️ Promise 1! Last line 1! Promise 2! Last line 2! Timeout 1! Timeout 2!
- ▫️ Last line 1! Timeout 1! Promise 1! Last line 2! Promise2! Timeout 2! 
- ✅ Last line 1! Promise 2! Last line 2! Promise 1! Timeout 1! Timeout 2!
- ▫️ Timeout 1! Promise 1! Last line 1! Promise 2! Timeout 2! Last line 2!

> First, we invoke funcOne. On the first line of funcOne, we call the asynchronous setTimeout function, from which the callback is sent to the Web API.
> 
> Then we call the myPromise promise, which is an asynchronous operation. Pay attention, that now only the first then clause was added to the microtask queue.
> 
> Both the promise and the timeout are asynchronous operations, the function keeps on running while it's busy completing the promise and handling the setTimeout callback. This means that Last line 1! gets logged first, since this is not an asynchonous operation.
> 
> Since the callstack is not empty yet, the setTimeout function and promise in funcOne cannot get added to the callstack yet.
> 
> In funcTwo, the variable res gets Promise because Promise.resolve(Promise.resolve('Promise')) is equivalent to Promise.resolve('Promise') since resolving a promise just resolves it's value. The await in this line stops the execution of the function until it receives the resolution of the promise and then keeps on running synchronously until completion, so Promise 2! and then Last line 2! are logged and the setTimeout is sent to the Web API. If the first then clause in funcOne had its own log statement, it would be printed before Promise 2!. Howewer, it executed silently and put the second then clause in microtask queue. So, the second clause will be printed after Promise 2!.
> 
> Then the call stack is empty. Promises are microtasks so they are resolved first when the call stack is empty so Promise 1! gets to be logged.
> 
> Now, since funcTwo popped off the call stack, the call stack is empty. The callbacks waiting in the queue (() => console.log("Timeout 1!") from funcOne, and () => console.log("Timeout 2!") from funcTwo) get added to the call stack one by one. The first callback logs Timeout 1!, and gets popped off the stack. Then, the second callback logs Timeout 2!, and gets popped off the stack.

---

### `js-lydia-082` (lydiahallie/javascript-questions #82)

- [ ] Checked by us

*Why:* Answer depends on the browser's top-level this; prompt now says "in a browser" (node prints undefined).

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

What is the output?

```
var status = '😎';

setTimeout(() => {
  const status = '😍';

  const data = {
    status: '🥑',
    getStatus() {
      return this.status;
    },
  };

  console.log(data.getStatus());
  console.log(data.getStatus.call(this));
}, 0);
```

- ▫️ `"🥑"` and `"😍"`
- ✅ `"🥑"` and `"😎"`
- ▫️ `"😍"` and `"😎"`
- ▫️ `"😎"` and `"😎"`

> The value of the `this` keyword is dependent on where you use it. In a **method**, like the `getStatus` method, the `this` keyword refers to _the object that the method belongs to_. The method belongs to the `data` object, so `this` refers to the `data` object. When we log `this.status`, the `status` property on the `data` object gets logged, which is `"🥑"`.
> 
> With the `call` method, we can change the object to which the `this` keyword refers. In **functions**, the `this` keyword refers to the _the object that the function belongs to_. We declared the `setTimeout` function on the _global object_, so within the `setTimeout` function, the `this` keyword refers to the _global object_. On the global object, there is a variable called _status_ with the value of `"😎"`. When logging `this.status`, `"😎"` gets logged.

**Ours**

What's the output in a browser?

```
var status = '😎';

setTimeout(() => {
  const status = '😍';

  const data = {
    status: '🥑',
    getStatus() {
      return this.status;
    },
  };

  console.log(data.getStatus());
  console.log(data.getStatus.call(this));
}, 0);
```

- ▫️ "🥑" and "😍"
- ✅ "🥑" and "😎"
- ▫️ "😍" and "😎"
- ▫️ "😎" and "😎"

> The value of the this keyword is dependent on where you use it. In a method, like the getStatus method, the this keyword refers to the object that the method belongs to. The method belongs to the data object, so this refers to the data object. When we log this.status, the status property on the data object gets logged, which is "🥑".
> 
> With the call method, we can change the object to which the this keyword refers. In functions, the this keyword refers to the the object that the function belongs to. We declared the setTimeout function on the global object, so within the setTimeout function, the this keyword refers to the global object. On the global object, there is a variable called status with the value of "😎". When logging this.status, "😎" gets logged.

---

### `js-lydia-002` (lydiahallie/javascript-questions #2)

- [ ] Checked by us

*Why:* Had 3 options; added "3 3 3 and 3 3 3".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

What's the output?

```
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}
```

- ▫️ `0 1 2` and `0 1 2`
- ▫️ `0 1 2` and `3 3 3`
- ✅ `3 3 3` and `0 1 2`

> Because of the event queue in JavaScript, the `setTimeout` callback function is called _after_ the loop has been executed. Since the variable `i` in the first loop was declared using the `var` keyword, this value was global. During the loop, we incremented the value of `i` by `1` each time, using the unary operator `++`. By the time the `setTimeout` callback function was invoked, `i` was equal to `3` in the first example.
> 
> In the second loop, the variable `i` was declared using the `let` keyword: variables declared with the `let` (and `const`) keyword are block-scoped (a block is anything between `{ }`). During each iteration, `i` will have a new value, and each value is scoped inside the loop.

**Ours**

What's the output?

```
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1);
}
```

- ▫️ 0 1 2 and 0 1 2
- ▫️ 0 1 2 and 3 3 3
- ✅ 3 3 3 and 0 1 2
- ▫️ 3 3 3 and 3 3 3

> Because of the event queue in JavaScript, the setTimeout callback function is called after the loop has been executed. Since the variable i in the first loop was declared using the var keyword, this value was global. During the loop, we incremented the value of i by 1 each time, using the unary operator ++. By the time the setTimeout callback function was invoked, i was equal to 3 in the first example.
> 
> In the second loop, the variable i was declared using the let keyword: variables declared with the let (and const) keyword are block-scoped (a block is anything between { }). During each iteration, i will have a new value, and each value is scoped inside the loop.

---

### `js-lydia-004` (lydiahallie/javascript-questions #4)

- [ ] Checked by us

*Why:* Had 3 options; added "1 and true".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

What's the output?

```
+true;
!'Lydia';
```

- ✅ `1` and `false`
- ▫️ `false` and `NaN`
- ▫️ `false` and `false`

> The unary plus tries to convert an operand to a number. `true` is `1`, and `false` is `0`.
> 
> The string `'Lydia'` is a truthy value. What we're actually asking, is "Is this truthy value falsy?". This returns `false`.

**Ours**

What's the output?

```
+true;
!'Lydia';
```

- ✅ 1 and false
- ▫️ false and NaN
- ▫️ false and false
- ▫️ 1 and true

> The unary plus tries to convert an operand to a number. true is 1, and false is 0.
> 
> The string 'Lydia' is a truthy value. What we're actually asking, is "Is this truthy value falsy?". This returns false.

---

### `js-lydia-006` (lydiahallie/javascript-questions #6)

- [ ] Checked by us

*Why:* Had 5 options; dropped "TypeError".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 7

**Original**

What's the output?

```
let c = { greeting: 'Hey!' };
let d;

d = c;
c.greeting = 'Hello';
console.log(d.greeting);
```

- ✅ `Hello`
- ▫️ `Hey!`
- ▫️ `undefined`
- ▫️ `ReferenceError`
- ▫️ `TypeError`

> In JavaScript, all objects interact by _reference_ when setting them equal to each other.
> 
> First, variable `c` holds a value to an object. Later, we assign `d` with the same reference that `c` has to the object.
> 
> <img src="https://i.imgur.com/ko5k0fs.png" width="200">
> 
> When you change one object, you change all of them.

**Ours**

What's the output?

```
let c = { greeting: 'Hey!' };
let d;

d = c;
c.greeting = 'Hello';
console.log(d.greeting);
```

- ✅ Hello
- ▫️ Hey!
- ▫️ undefined
- ▫️ ReferenceError

> In JavaScript, all objects interact by reference when setting them equal to each other.
> 
> First, variable c holds a value to an object. Later, we assign d with the same reference that c has to the object.
> 
> When you change one object, you change all of them.

---

### `js-lydia-009` (lydiahallie/javascript-questions #9)

- [ ] Checked by us

*Why:* Had 3 options; added "SyntaxError".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

What's the output?

```
let greeting;
greetign = {}; // Typo!
console.log(greetign);
```

- ✅ `{}`
- ▫️ `ReferenceError: greetign is not defined`
- ▫️ `undefined`

> It logs the object, because we just created an empty object on the global object! When we mistyped `greeting` as `greetign`, the JS interpreter actually saw this as:
> 
> 1. `global.greetign = {}` in Node.js
> 2. `window.greetign = {}`, `frames.greetign = {}` and `self.greetign` in browsers.
> 3. `self.greetign` in web workers.
> 4. `globalThis.greetign` in all environments.
> 
> In order to avoid this, we can use `"use strict"`. This makes sure that you have declared a variable before setting it equal to anything.

**Ours**

What's the output?

```
let greeting;
greetign = {}; // Typo!
console.log(greetign);
```

- ✅ {}
- ▫️ ReferenceError: greetign is not defined
- ▫️ undefined
- ▫️ SyntaxError

> It logs the object, because we just created an empty object on the global object! When we mistyped greeting as greetign, the JS interpreter actually saw this as:
> 
> 1. global.greetign = {} in Node.js
> 2. window.greetign = {}, frames.greetign = {} and self.greetign in browsers.
> 3. self.greetign in web workers.
> 4. globalThis.greetign in all environments.
> 
> In order to avoid this, we can use "use strict". This makes sure that you have declared a variable before setting it equal to anything.

---

### `js-lydia-017` (lydiahallie/javascript-questions #17)

- [ ] Checked by us

*Why:* Had 3 options; added a fourth.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 2

**Original**

What's the output?

```
function getPersonInfo(one, two, three) {
  console.log(one);
  console.log(two);
  console.log(three);
}

const person = 'Lydia';
const age = 21;

getPersonInfo`${person} is ${age} years old`;
```

- ▫️ `"Lydia"` `21` `["", " is ", " years old"]`
- ✅ `["", " is ", " years old"]` `"Lydia"` `21`
- ▫️ `"Lydia"` `["", " is ", " years old"]` `21`

> If you use tagged template literals, the value of the first argument is always an array of the string values. The remaining arguments get the values of the passed expressions!

**Ours**

What's the output?

```
function getPersonInfo(one, two, three) {
  console.log(one);
  console.log(two);
  console.log(three);
}

const person = 'Lydia';
const age = 21;

getPersonInfo`${person} is ${age} years old`;
```

- ▫️ "Lydia" 21 ["", " is ", " years old"]
- ✅ ["", " is ", " years old"] "Lydia" 21
- ▫️ "Lydia" ["", " is ", " years old"] 21
- ▫️ "Lydia is 21 years old" undefined undefined

> If you use tagged template literals, the value of the first argument is always an array of the string values. The remaining arguments get the values of the passed expressions!

---

### `js-lydia-018` (lydiahallie/javascript-questions #18)

- [ ] Checked by us

*Why:* Had 3 options; added "TypeError".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

What's the output?

```
function checkAge(data) {
  if (data === { age: 18 }) {
    console.log('You are an adult!');
  } else if (data == { age: 18 }) {
    console.log('You are still an adult.');
  } else {
    console.log(`Hmm.. You don't have an age I guess`);
  }
}

checkAge({ age: 18 });
```

- ▫️ `You are an adult!`
- ▫️ `You are still an adult.`
- ✅ `Hmm.. You don't have an age I guess`

> When testing equality, primitives are compared by their _value_, while objects are compared by their _reference_. JavaScript checks if the objects have a reference to the same location in memory.
> 
> The two objects that we are comparing don't have that: the object we passed as a parameter refers to a different location in memory than the object we used in order to check equality.
> 
> This is why both `{ age: 18 } === { age: 18 }` and `{ age: 18 } == { age: 18 }` return `false`.

**Ours**

What's the output?

```
function checkAge(data) {
  if (data === { age: 18 }) {
    console.log('You are an adult!');
  } else if (data == { age: 18 }) {
    console.log('You are still an adult.');
  } else {
    console.log(`Hmm.. You don't have an age I guess`);
  }
}

checkAge({ age: 18 });
```

- ▫️ You are an adult!
- ▫️ You are still an adult.
- ✅ Hmm.. You don't have an age I guess
- ▫️ TypeError

> When testing equality, primitives are compared by their value, while objects are compared by their reference. JavaScript checks if the objects have a reference to the same location in memory.
> 
> The two objects that we are comparing don't have that: the object we passed as a parameter refers to a different location in memory than the object we used in order to check equality.
> 
> This is why both { age: 18 } === { age: 18 } and { age: 18 } == { age: 18 } return false.

---

### `js-lydia-026` (lydiahallie/javascript-questions #26)

- [ ] Checked by us

*Why:* Had 2 options; reworded as a 4-option question.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 2

**Original**

The JavaScript global execution context creates two things for you: the global object, and the "this" keyword.

- ✅ true
- ▫️ false
- ▫️ it depends

> The base execution context is the global execution context: it's what's accessible everywhere in your code.

**Ours**

What does the JavaScript global execution context create for you?

- ✅ The global object and the this keyword
- ▫️ Only the global object
- ▫️ Only the this keyword
- ▫️ Neither: both are created per function call

> The base execution context is the global execution context: it's what's accessible everywhere in your code.

---

### `js-lydia-077` (lydiahallie/javascript-questions #77)

- [ ] Checked by us

*Why:* Had 2 options; reworded as a 4-option question.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

Is this a pure function?

```
function sum(a, b) {
  return a + b;
}
```

- ✅ Yes
- ▫️ No

> A pure function is a function that _always_ returns the same result, if the same arguments are passed.
> 
> The `sum` function always returns the same result. If we pass `1` and `2`, it will _always_ return `3` without side effects. If we pass `5` and `10`, it will _always_ return `15`, and so on. This is the definition of a pure function.

**Ours**

Is this a pure function?

```
function sum(a, b) {
  return a + b;
}
```

- ✅ Yes
- ▫️ No: it has side effects
- ▫️ No: it can return different results for the same arguments
- ▫️ Only when a and b are numbers

> A pure function is a function that always returns the same result, if the same arguments are passed.
> 
> The sum function always returns the same result. If we pass 1 and 2, it will always return 3 without side effects. If we pass 5 and 10, it will always return 15, and so on. This is the definition of a pure function.

---

### `js-lydia-107` (lydiahallie/javascript-questions #107)

- [ ] Checked by us

*Why:* Had 2 options; added two.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 1

**Original**

What's its value?

```
console.log('❤️' === '❤️');
```

- ✅ `true`
- ▫️ `false`

> Under the hood, emojis are unicodes. The unicodes for the heart emoji is `"U+2764 U+FE0F"`. These are always the same for the same emojis, so we're comparing two equal strings to each other, which returns true.

**Ours**

What's its value?

```
console.log('❤️' === '❤️');
```

- ✅ true
- ▫️ false
- ▫️ It depends on the file encoding
- ▫️ TypeError

> Under the hood, emojis are unicodes. The unicodes for the heart emoji is "U+2764 U+FE0F". These are always the same for the same emojis, so we're comparing two equal strings to each other, which returns true.

---

## 7. Wording or typos only (15)

No change in meaning; listed so nothing is hidden.

### `python-fcc-047` (python-quiz.ts #47)

- [ ] Checked by us

*Why:* Leading spaces in options.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

In Python, what is the addition assignment operator?

- ✅  +=
- ▫️  =+
- ▫️  +
- ▫️ ==

> The += operator lets you add a value (right operand) to the current value of a variable and store the result of the calculation in the same variable (left operand). This is shorter than using + and then = separately.

**Ours**

What is the addition assignment operator?

- ▫️ ==
- ▫️ =+
- ▫️ +
- ✅ +=

> The += operator lets you add a value (right operand) to the current value of a variable and store the result of the calculation in the same variable (left operand). This is shorter than using + and then = separately.

---

### `python-fcc-060` (python-quiz.ts #60)

- [ ] Checked by us

*Why:* Typo "smallest)".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

In Python, what built-in function returns the smallest item in an iterable or the smallest of two or more arguments?

- ✅ min()
- ▫️ max()
- ▫️ minimum()
- ▫️ smallest)

> The min() function returns the smallest item in an iterable or the smallest of two or more arguments.

**Ours**

What built-in function returns the smallest item in an iterable or the smallest of two or more arguments?

- ▫️ minimum()
- ▫️ max()
- ▫️ smallest()
- ✅ min()

> The min() function returns the smallest item in an iterable or the smallest of two or more arguments.

---

### `python-fcc-068` (python-quiz.ts #68)

- [ ] Checked by us

*Why:* Curly quotes.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

In Python, how can you write a “Hello, World” program?

- ✅ print(“Hello, World!”)
- ▫️ console.log(“Hello, World!”)
- ▫️ show(“Hello, World!”)
- ▫️ console(“Hello, World!”)

> In Python, we use the built-in print() function to print a value to the console. We pass the value as an argument within parentheses. 

**Ours**

How can you write a “Hello, World” program?

- ✅ print("Hello, World!")
- ▫️ echo("Hello, World!")
- ▫️ show("Hello, World!")
- ▫️ console.log("Hello, World!")

> In Python, we use the built-in print() function to print a value to the console. We pass the value as an argument within parentheses.

---

### `python-fcc-137` (python-quiz.ts #137)

- [ ] Checked by us

*Why:* Wording.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 9

**Original**

Which Python keyword is added to the open() function while reading a file to ensure the file gets closed?

- ✅ with
- ▫️ await
- ▫️ pass
- ▫️ finally

> Calling the open() function while using the with statement automatically closes a file after being processed.

**Ours**

Which statement makes sure a file opened with open() gets closed?

- ▫️ pass
- ▫️ await
- ▫️ finally
- ✅ with

> Calling the open() function while using the with statement automatically closes a file after being processed.

---

### `python-fcc-157` (python-quiz.ts #157)

- [ ] Checked by us

*Why:* Dropped "Python".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 4

**Original**

Which of the following statements is true regarding the Python random library?

- ✅ The random library can only generate pseudo-random numbers.
- ▫️ The random library can generate true random numbers based on hardware entropy.
- ▫️ The random library is primarily used for generating random strings.
- ▫️ The random library cannot be used to generate random numbers within a specified range.

> The random module in Python generates pseudo-random numbers, which are generated by mathematical algorithms and are not truly random but are sufficiently unpredictable for many purposes. To generate truly random numbers, you may need specialized hardware or external services, which are not provided by the random module.

**Ours**

Which of the following statements is true about the random module?

- ▫️ The random library is primarily used for generating random strings.
- ▫️ The random library can generate true random numbers based on hardware entropy.
- ▫️ The random library cannot be used to generate random numbers within a specified range.
- ✅ The random library can only generate pseudo-random numbers.

> The random module in Python generates pseudo-random numbers, which are generated by mathematical algorithms and are not truly random but are sufficiently unpredictable for many purposes. To generate truly random numbers, you may need specialized hardware or external services, which are not provided by the random module.

---

### `python-fcc-161` (python-quiz.ts #161)

- [ ] Checked by us

*Why:* Dropped "Python".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

Which of the following statements about Python decorators is false?

- ✅ Decorators are applied to a function at compile time.
- ▫️ A decorator is a function that takes another function and extends its behavior without explicitly modifying it.
- ▫️ Decorators can be applied to classes as well as functions.
- ▫️ Multiple decorators can be applied to a single function.

> Decorators in Python are applied at runtime, not at compile time. When a decorated function is defined, the decorator is executed immediately, and the result replaces the original function definition in the namespace.

**Ours**

Which of the following statements about decorators is false?

- ▫️ Decorators can be applied to classes as well as functions.
- ✅ Decorators are applied to a function at compile time.
- ▫️ A decorator is a function that takes another function and extends its behavior without explicitly modifying it.
- ▫️ Multiple decorators can be applied to a single function.

> Decorators in Python are applied at runtime, not at compile time. When a decorated function is defined, the decorator is executed immediately, and the result replaces the original function definition in the namespace.

---

### `cs-fcc-049` (general-cs-quiz.ts #49)

- [ ] Checked by us

*Why:* "O(n14)" means O(n^14).

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

Which one of these is NOT a common time complexity equation for Big O notation?

- ✅ O(n14)
- ▫️ O(1)
- ▫️ O(log n)
- ▫️ O(n)

> O(1), O(log n), O(n) are just some of the common time complexity equations for Big O notation.

**Ours**

Which one of these is NOT a common time complexity equation for Big O notation?

- ▫️ O(1)
- ▫️ O(log n)
- ✅ O(n^14)
- ▫️ O(n)

> O(1), O(log n), O(n) are just some of the common time complexity equations for Big O notation.

---

### `cs-fcc-057` (general-cs-quiz.ts #57)

- [ ] Checked by us

*Why:* Said which kind of array.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

Which of the following is correct for arrays?

- ✅ Size of an array can not be changed once initialized
- ▫️ Insertion and deletion of elements has a time complexity of O(1)
- ▫️ A single array can contain data of different data types
- ▫️ It can only be one-dimensional

> When you create an array, you are allocated a block of contiguous memory and in order to change it's size, you will have to create a new array.

**Ours**

Which is true of a fixed-size array, like a plain array in C or Java?

- ▫️ It can only be one-dimensional
- ▫️ Insertion and deletion of elements has a time complexity of O(1)
- ✅ Size of an array can not be changed once initialized
- ▫️ A single array can contain data of different data types

> When you create an array, you are allocated a block of contiguous memory and in order to change it's size, you will have to create a new array.

---

### `cs-fcc-160` (general-cs-quiz.ts #160)

- [ ] Checked by us

*Why:* Wording.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 1

**Original**

In a Red-Black Tree, every tree leaf node is _________

- ✅ Black
- ▫️ Red
- ▫️ Red or Black
- ▫️ White

> A Red-Black Tree is a self-balancing Binary Search Tree (BST) and every tree leaf node is always black.

**Ours**

In a Red-Black Tree, every leaf (NIL) node is...

- ▫️ Red
- ✅ Black
- ▫️ White
- ▫️ Red or Black

> A Red-Black Tree is a self-balancing Binary Search Tree (BST) and every tree leaf node is always black.

---

### `cs-fcc-179` (general-cs-quiz.ts #179)

- [ ] Checked by us

*Why:* Dropped "in LLD" (load balancing is high-level design).

*Explanation:* unchanged (apart from formatting) · *Practicality:* 4

**Original**

What is load balancing in LLD(Low Level Design)?

- ✅  Distribution of  network traffic evenly across multiple servers
- ▫️ An Internet Protocol
- ▫️ Removing excess load from a server
- ▫️ Allocating more resources to a single server

> Load balancing is a technique used in computing and networking to distribute incoming network traffic or workload across multiple servers, devices, or resources. The primary goal of load balancing is to optimize resource utilization, maximize throughput, minimize response time, and ensure high availability of services.

**Ours**

What is load balancing?

- ▫️ Removing excess load from a server
- ▫️ An Internet Protocol
- ✅ Distributing network traffic across multiple servers
- ▫️ Allocating more resources to a single server

> Load balancing is a technique used in computing and networking to distribute incoming network traffic or workload across multiple servers, devices, or resources. The primary goal of load balancing is to optimize resource utilization, maximize throughput, minimize response time, and ensure high availability of services.

---

### `js-fcc-004` (javascript-quiz.ts #4)

- [ ] Checked by us

*Why:* Dropped "in JavaScript".

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

What does the 'debugger' statement in JavaScript do?

- ✅ It acts as a breakpoint in a program
- ▫️ It will debug errors in the current statement
- ▫️ It will debug all the errors in the program at runtime
- ▫️ All of the above

> The 'debugger' statement is used to setup the breakup points at probable points of errors in the code snippet, using the debugger window.

**Ours**

What does the 'debugger' statement do?

- ▫️ It will debug all the errors in the program at runtime
- ▫️ It will debug errors in the current statement
- ✅ It acts as a breakpoint in a program
- ▫️ All of the above

> The 'debugger' statement is used to setup the breakup points at probable points of errors in the code snippet, using the debugger window.

---

### `js-fcc-020` (javascript-quiz.ts #20)

- [ ] Checked by us

*Why:* Wording.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

Which Web API used with JavaScript provides information about the size and position of an element?

- ✅ .getBoundingClientRect()
- ▫️ .getOwnPropertyDescriptors()
- ▫️ .assign()
- ▫️ .entries()

> The Element.getBoundingClientRect() method returns a DOMRect object providing information about the size of an element and its position relative to the viewport.

**Ours**

Which DOM method gives the size and position of an element?

- ▫️ .entries()
- ▫️ .getOwnPropertyDescriptors()
- ✅ .getBoundingClientRect()
- ▫️ .assign()

> The Element.getBoundingClientRect() method returns a DOMRect object providing information about the size of an element and its position relative to the viewport.

---

### `js-fcc-043` (javascript-quiz.ts #43)

- [ ] Checked by us

*Why:* "day of the hour" typo.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 3

**Original**

In JavaScript, which of the following methods returns the day of the hour for the specified date, according to local time?

- ✅ getHours()
- ▫️ getMyHour()
- ▫️ getMilliseconds()
- ▫️ getHour()

> The getHours() method returns the hour for the specified date, according to local time. 

**Ours**

Which method returns the hour of a date, according to local time?

- ▫️ getHour()
- ▫️ getMyHour()
- ✅ getHours()
- ▫️ getMilliseconds()

> The getHours() method returns the hour for the specified date, according to local time.

---

### `js-fcc-060` (javascript-quiz.ts #60)

- [ ] Checked by us

*Why:* Wording.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 6

**Original**

In JavaScript, which pair of symbols can be used in place of quotes to define a string?

- ✅ Template literals : ``
- ▫️ Square brackets: []
- ▫️ Curly braces: {}
- ▫️ Angle brackets: <>

> Template literals are literals delimited with backticks (`), allowing embedded expressions called substitutions. Untagged template literals result in strings, which makes them useful for string interpolation (and multiline strings, since unescaped newlines are allowed).

**Ours**

Which pair of symbols can be used in place of quotes to define a string?

- ▫️ Angle brackets: <>
- ▫️ Square brackets: []
- ▫️ Curly braces: {}
- ✅ Backticks: ``

> Template literals are literals delimited with backticks (`), allowing embedded expressions called substitutions. Untagged template literals result in strings, which makes them useful for string interpolation (and multiline strings, since unescaped newlines are allowed).

---

### `js-fcc-170` (javascript-quiz.ts #170)

- [ ] Checked by us

*Why:* "setTimeOut" casing.

*Explanation:* unchanged (apart from formatting) · *Practicality:* 5

**Original**

Which of the following options is a web API that runs code asynchronously in JavaScript?

- ✅ setTimeOut()
- ▫️ repeat()
- ▫️ timeOut()
- ▫️ delay()

> The setTimeout() function is an asynchronous function that will not pause execution of other functions in the stack.

**Ours**

Which of the following options is a web API that runs code asynchronously?

- ▫️ delay()
- ▫️ repeat()
- ▫️ timeOut()
- ✅ setTimeout()

> The setTimeout() function is an asynchronous function that will not pause execution of other functions in the stack.

---
