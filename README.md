# react-json-form

Receive JSON form data from backend and render it as the form component.

## Status

WIP

## Usage

```tsx
import JsonFrom from '@bc/react-json-form';

<JsonForm fields={fields} />;
```

## Demo

### online demo

[xxx]()

### local demo

```sh
npm install
cd playground
npm install
npm start
```

## API

### JsonForm 组件

接收一个 [Field](#field-design) 数组，渲染整个 Form 控件。

### JsonFormConfig

全局配置组件，传入配置，包含组件配置，验证方法和错误信息的配置。

也可以局部使用，覆盖全局配置。

### useField

react hook，用于获取当前组件对应的 Field 对象。

### useFieldControl

react hook，用于获取控件的 value、error、touched 信息，已经 setValue、setTouched、setError 方式修改控件的状态。

### useFieldArrayControl

react hook，特别针对 array 类型控件，除了上面跳到的方法，额外增加了 add 和 remove 方法，用于增加删除子项。

### useConfig

react hook，可以获取全局配置

## Idea

### Basic aims

- expressive
- component agnostic
- flexible and simple structure, convenient for both FE and Backend

### Field design

Field 是 Form 结构中的原子单位，整个 Form 由 Field 组成。

Field 就是一个普通的对象，其中可以有多个属性，每个属性都表示不同的语义。不同属性可以通过组合，嵌套来表示更复杂的语义。

Field 可以有一个`type`属性，代表这个 Field 将要渲染属性值中的 react component。

```js
{
  "type": "<component name>"
}
```

Field 还可以有一个 `wrapper`属性，代表多个 react component，表示这个 Field 接下来渲染的 react element 都会作为这些 component 的 children。

```js
{
  "wrapper": ["component1", "component2"]
}
```

两者可以组合使用。

两者的主要区别是，如果当前 Field 含有嵌套 Field，`wrapper`只负责将传递给它的 children 直接渲染出来。而`type`则是全权负责嵌套 Field 的渲染工作，甚至可以渲染部分渲染，或者不渲染嵌套 Field。

```js
{
  "wrapper": ["component1", "component2"],
  "type": "<component name>"
}
```

`name`属性表示这个 Field 渲染的控件所录入的用户输入在最终的表单值中以 name 属性值作为 key。

```js
/**
 * form value: {"a": "user input value" }
 */
{
  "name": "a",
  "type": "component"
}
```

`group`属性表示嵌套的 Field。

```js
/**
 * form value:
 * {
 *    "a": {
 *      "b": "user input",
 *      "c": "use input"
 *    }
 * }
 */
{
  "name": "a",
  "group": [
    { "name": "b", "type": "component1" },
    { "name": "c", "type": "component2" }
  ]
}
```

也可以利用`group`将多个 Field 包在一起。

```js
{
  "wrapper": ["wrapper component"],
  "group": [
    { "name": "a", "type": "input component" },
    { "name": "b", "type": "input component" }
  ]
}
```

`array`属性值是一个普通的 Field，表示表单结果中的一个数组值的类型。

```js
/**
 * form value: {"a": ["1", "2", "3"]}
 */
{
  "name": "a",
  "array": {
    "type": "input component"
  }
}
```

或者是一个更复杂的类型。

```js
/**
 * form value:
 * {
 *    "a": [{"b":"1", "c":"2"}, {"b":"2", "c":"3"}]
 * }
 */
{
  "name": "a",
  "array": {
    "group": [
      { "name": "b", "type": "input component" },
      { "name": "c", "type": "input component" }
    ]
  }
}
```

`props`属性表示将要传递给`type`或/和`wrapper`组件的 props。

```js
{
  "name": "a",
  "type": "component",
  "props": {
    "label": "user name",
    "placeholder": "input your name"
  }
}
```

`expressions`属性表示需要动态计算的值，其中以`props.xxx`形式表示的计算值将会合并到`props`属性值中。而特殊的`hide`属性是一个 boolean 类型，表示当前 Field 是否显示。

`expressions`属性的子属性值是一个特殊字符串，可以表示简单的 js 代码，因此我们可以实现不同 Field 之间的关联关系。子属性值中的`values`代表整个表单值，从中可以获取到关联表单控件的 value。

```js
[
  {
    name: 'a',
    type: 'component',
  },
  // 如果在a控件中输入 "hide"，b控件不显示
  // 如果a控件值不为空，b控件则需要显示自己必填
  {
    name: 'b',
    type: 'component',
    expressions: {
      hide: "values.a=='hide'",
      'props.required': "values.a!==''",
    },
  },
];
```

`validators`属性表示一个 Field 的验证方式。

```js
{
  "name": "a",
  "type": "component",
  "props": { "label": "age" },
  "validators": ["required", ["max", { "value": 100 }]]
}
```

## Todos

- ~~adequate test cases~~
- fewer bugs
- more demos
- global validators
- english version doc
- plugins

## Others

**inspired by [ngx-formly](https://github.com/ngx-formly/ngx-formly)**
