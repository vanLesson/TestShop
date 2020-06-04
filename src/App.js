import React, { useState, Component, useEffect, useMemo } from "react";
import { createStore, combineReducers, applyMiddleware } from "redux";
import { Provider, connect } from "react-redux";
import * as jwt_decode from "jwt-decode";
import thunk from 'redux-thunk';
import { Router, Route, Link, Redirect } from 'react-router-dom';
import createHistory from "history/createBrowserHistory";

const getGQL = (url, headers = {}) => (query = "", variables = {}) =>
  fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  }).then((res) => res.json());

let GQL = getGQL("http://shop-roles.asmer.fs.a-level.com.ua/graphql");
function authReducer(state, action) {
  if (!state) {
    if (!localStorage.authToken) {
      return {};
    } else {
      action.type = "AUTH_LOGIN";
      action.token = localStorage.authToken;
    }
  }

  if (action.type === "AUTH_LOGIN") {
    const jwt = action.token;

    const data = jwt_decode(jwt);
    console.log(data);
    localStorage.setItem("authToken", jwt);

    return { jwt: jwt, data: data };
  }
  if (action.type === "AUTH_LOGOUT") {
    localStorage.setItem("authToken", "");
    return {};
  }

  return state;
}

class LoginForm extends React.Component {
  state = {
    login: "",
    password: "",
  };
  render() {
    const valid = true;
    // (this.state.value1.length < this.props.min || this.state.value !== this.state.value1 || this.state.value.length < this.props.min)

    return (
      <>
        <div>
          <input
            type="text"
            placeholder="Login..."
            value={this.state.login}
            onChange={(e) => this.setState({ login: e.target.value })}
            style={{
              backgroundColor: !valid ? "#f0999f" : "",
            }}
          />
          <input
            type="password"
            placeholder="Password..."
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value })}
            style={{
              backgroundColor: !valid ? "#f0999f" : "",
            }}
          />
          <button
            onClick={() =>
              this.props.onLogin(this.state.login, this.state.password)
            }
            disabled={!valid}
          >
            OK
          </button>
        </div>
      </>
    );
  }
}
function promiseReducer(state, { type, key, ...action }) {
  if (!state) {
    return {};
  }
  if (type === "PROMISE") {
    return { ...state, [key]: action, };
  }
  return state;
}

function bascketReduser(state, { type, _id, count }) {
  if (!state) {
    return {}
  } if (type === "CART_ADD") {
    return { ...state, [_id]: state[_id] ? state[_id] + 1 : 1 }
  } if (type === "CART_CHANGE") {
    return { ...state, [_id]: +count }
  } if (type === "CART_DELETE") {
    let a = { ...state }
    delete a[_id]
    return a
  } if (type === "CART_MINUS") {
    debugger
    return { ...state, [_id]: state[_id] - 1 }
  } if (type === "CART_PLUS") {
    return { ...state, [_id]: state[_id] + 1 }
  }
  return state
}
const actionADD = (_id) => ({ type: "CART_ADD", _id })
const actionDelete = (_id) => ({ type: "CART_DELETE", _id })
const actionCartChange = (_id, count) => ({ type: "CART_CHANGE", _id, count })
const actionMinus = (_id, count) => ({ type: "CART_MINUS", _id, count })
const actionPlus = (_id, count) => ({ type: "CART_PLUS", _id, count })

const reducers = combineReducers({
  //создаем функцию-обертку, которая запустит последовательно counterReducer и booleanReducer передав им ветви c и b хранилища и обновив эти же ветви в случае нового состояния.
  auth: authReducer,
  promise: promiseReducer,
  bascket: bascketReduser,
});

const store = createStore(reducers, applyMiddleware(thunk)) //вторым параметром идет миддлварь

store.subscribe(() => console.log(store.getState()));
const delay = ms => new Promise(ok => setTimeout(() => ok(ms), ms))

const actionFetch = (key, promise) => {
  const actionPending = () => {
    return { status: "PENDING", payload: null, error: null, type: "PROMISE", key };
  };
  const actionResolved = (payload) => {
    return { status: "RESOLVED", payload, error: null, type: "PROMISE", key };
  };
  const actionRejected = (error) => {
    return { status: "REJECTED", payload: null, error: error, type: "PROMISE", key };
  };
  return async dispatch => { //возвращаем функцию. 
    dispatch(actionPending())
    try {
      let resolved = await promise
      dispatch(actionResolved(resolved))
      return resolved
    }
    catch (error) {
      dispatch(actionRejected(error))
    }


  }
}
function actionCategories() {
  return (async dispatch => {
    await dispatch(actionFetch("categories", GQL(`query cats{
      CategoryFind(query: "[{}]"){
        _id name parent{
          name
        }
        subCategories {
          name
        }
        goods {
          name
          images {
            _id, url
          }
        }
          }
    }`)))



  })
}
store.dispatch(actionCategories())

class RegistrationForm extends React.Component {
  state = {
    login: "",
    password: "",
  };
  render() {
    const valid = true;
    // (this.state.value1.length < this.props.min || this.state.value !== this.state.value1 || this.state.value.length < this.props.min)

    return (
      <>
        <div>
          <input
            type="text"
            placeholder="NICk"
            value={this.state.login}
            onChange={(e) => this.setState({ login: e.target.value })}
            style={{
              backgroundColor: !valid ? "#f0999f" : "",
            }}
          />
          <input
            type="password"
            placeholder="Parol"
            value={this.state.password}
            onChange={(e) => this.setState({ password: e.target.value })}
            style={{
              backgroundColor: !valid ? "#f0999f" : "",
            }}
          />
          <button
            onClick={() =>
              this.props.onReg(this.state.login, this.state.password)
            }
            disabled={!valid}
          >
            OK
          </button>
        </div>
      </>
    );
  }
}



function actionLogin(login, password) {
  return (async dispatch => {


    let token = await dispatch(actionFetch("login", GQL(
      `query login($login: String, $password: String){
          login(login: $login, password: $password)
      }`,
      { login, password }
    )))

    dispatch(actionAuthLogin(token.data.login))
  })
}
function actionRegister(login, password) {
  return (async dispatch => {


    let reg = await dispatch(actionFetch("reg", GQL(
      `mutation reg($login: String, $password: String){
          UserUpsert(user: {login:$login, password: $password})
          {_id 
            login
          }
      }`,
      { login, password }
    )
    ))
    await dispatch(actionLogin(login, password))


    console.log(reg)

  })
}

// const someID="5dc94bd00e36db246e3049ee"
function actionCategory(_id) {
  const query = [{ _id }]

  return actionFetch("category", GQL(
    `query gf($query: String){
               CategoryFindOne(query: $query){
                _id
                name
                goods {
                  _id
                  name
                  description
                  price
                  images{
                    url
                  }
                }    
              }
            }`,
    { query: JSON.stringify(query) }
  ))
}
function actionGood(_id) {
  const goodId = [{ _id }]
  return (actionFetch(
    "good", GQL(`query good($goodId:String){
      GoodFindOne(query:$goodId){
        _id
        name
        description
        price
        images{
          url
        }
      }
    }`, { goodId: JSON.stringify(goodId) }
    )
  )
  )
}
store.dispatch(actionGood())
// store.dispatch(actionCategory(someID))
const mapStateToProps = (state) => ({
  login: state.auth.data && state.auth.data.sub.login,
});
const mapStateToReg = (state) => ({
  _id: state.data && state.data.sub._id,
});

const UserName = ({ login }) =>
  login ? <a href="/dashboard">{login}</a> : <span>Anon</span>;

const UserNameAfterregistration = ({ reg }) =>
  reg ? <a href="/dashboard">{reg}</a> : <span>Anon</span>;

const actionAuthLogin = (token) => ({ type: "AUTH_LOGIN", token });

const actionAuthLogout = () => ({ type: "AUTH_LOGOUT" });

const CLogoutButton = connect(
  (state) => ({ children: "logout", disabled: !state.auth.data }),
  {
    onClick: actionAuthLogout,
  }
)("button");

const CPromiseStatus = connect(
  (state) => ({ children: state.promise.status }),
  {
    onClick: () => actionFetch(delay(2000)),
  }
)("div");
const CUserName = connect(mapStateToProps)(UserName);

const Pending = () => <img src="https://flevix.com/wp-content/uploads/2019/07/Spin-Preloader.gif"></img>

const Good = ({ good }) => {

  return (<div>
    <Link to={`/good/${good._id}`}>
      <div>
        {good.name}
        <img src={`http://shop-roles.asmer.fs.a-level.com.ua/${good.images[0].url}`}></img>
        <p> {good.description}</p>
        <p> {good.price} грн</p>

      </div>
    </Link>
  </div>)
}

const GoodsList = ({ goods }) => goods ? (
  <>
    {goods.map(good => <Good good={good} />)}

  </>
) : <Pending />
const GoodInfo = ({ good, onAdd, onDelete, onChange, onPlus, onMinu, cart }) => good ?
  <>
    <div>
      <div>
        {good.name}
        <img src={`http://shop-roles.asmer.fs.a-level.com.ua/${good.images[0].url}`} alt="Photo" ></img>
        <p> {good.description}</p>
        <p> {good.price} грн</p>
        <button onClick={() => onAdd(good._id, good.description, good.price)}>Добавить товар</button>
        <button onClick={() => onDelete(good._id, good.description, good.price)} disabled={!cart[good._id]} >Удалить</button>
        <button onClick={(count) => onPlus(good._id, count)}>Добавить</button>
        <button onClick={(count) => onMinu(good._id, count)}>Убрать</button>
        <input onChange={(event) => onChange(good._id, event.target.value)} />
      </div>
    </div>
  </>
  : <Pending />
const CGoodOne = connect((state) => ({ cart: state.bascket, good: state.promise.good && state.promise.good.payload && state.promise.good.payload.data.GoodFindOne }), { onAdd: actionADD, onDelete: actionDelete, onChange: actionCartChange, onPlus: actionPlus, onMinu: actionMinus })(GoodInfo)
const GoodPage = ({
  match: {
    params: { _id },
  },
  getData,
}) => {
  useMemo(() => getData(_id) && false, [_id])
  return <CGoodOne />
}
const CGoodPage = connect(null, { getData: actionGood })(GoodPage)
const CGoodsList = connect((state) => ({
  goods: state.promise.category &&
    state.promise.category.payload &&
    state.promise.category.payload.data.CategoryFindOne.goods
}))(GoodsList)

const CategoryItem = ({ category }) => <div>

  <Link to={`/category/${category._id}`}>
    {category.name}
  </Link>
</div>

const CategoriesList = ({ categories }) => categories ? (
  <>
    {categories.map(category => <CategoryItem category={category} />)}

  </>
) : <Pending />
const CCategoriesList = connect((state) => ({
  categories: state.promise.categories &&
    state.promise.categories.payload &&
    state.promise.categories.payload.data.CategoryFind
}))(CategoriesList)

const CategoryPage = ({ match: { params: { _id } }, getData }) => {
  useMemo(() => getData(_id) && false, [_id])
  return (<>
    <CGoodsList />
  </>)
}
const CLoginForm = connect(null, { onLogin: actionLogin })(LoginForm)
const CRegForm = connect(null, { onReg: actionRegister })(RegistrationForm)
const CCategoryPage = connect(null, { getData: actionCategory })(CategoryPage)
const CCart = () => <div>CARZINA</div>

const RoledRoute = ({ fallback, auth, roles, ...props }) => {
  const OriginalComponent = props.component
  const CheckComponent = ({ history, ...p }) => {
    if (!auth) {
      return <Redirect to={fallback} />
    }
    const acl = auth.sub.acl
    if (acl.some((element) => roles.includes(element))) {
      return (<OriginalComponent {...p} />)
    }
    return <Redirect to={fallback} />
  }
  return (<> <Route {...props} component={CheckComponent} /></>)
}
const CRoledRoute = connect((state) => ({ auth: state.auth.data }))(RoledRoute)

const App = () => {

  return (
    <>

      <Provider store={store}>
        <Router history={createHistory()}>
          <header >
            <Link to="/">Main</Link>
            <Link to="/SignIn">SignIn</Link>
            <Link to="/SignUp">SignUp</Link>
            <CUserName />
            <CLogoutButton />
            <CPromiseStatus />
          </header>
          <div>
            <Route path="/SignIn" component={CLoginForm} />
            <Route path="/SignUp" component={CRegForm} />
            <Route path="/" component={CCategoriesList} />
            <Route path="/category/:_id" component={CCategoryPage} />
            <CRoledRoute path="/cart" component={CCart} roles={["user", "admin"]} fallback="/login" />
            <Route path="/good/:_id" component={CGoodPage} />
          </div>
        </Router>
      </Provider>

    </>
  );
};

export default App;
