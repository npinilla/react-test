import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

const axiosStarWarsGraphQL = axios.create({
  baseURL: 'https://api.graphcms.com/simple/v1/swapi',
});

const TITLE = 'Star Wars Characters';

const GET_PERSON = `
  query($name: String!){
    Person(name: $name) {
      name
      homeworld{
        name
      }
      species{
        id
        name
      }
      starships{
        id
        name
      }
      films(orderBy: episodeId_ASC){
        id
        title
      }
    }
  }
`;

const GET_ALL_PERSONS = `
  query($filter: String!){
    allPersons(
      filter: { name_contains: $filter }
      orderBy: name_ASC
    ){
      id
      name
    }
  }
`;

const GET_FAVORITES = `
  query($favorites: [String!]){
    allPersons(
      filter: { name_in: $favorites }
      orderBy: name_ASC
    ){
      id
      name
    }
  }
`;

class App extends Component {
  state = {
    filter: '',
    person: null,
    favorites: [],
    showFavorites: false,
    allPersons: [],
    errors: null,
  };

  async componentDidMount() {
    const result = await this.fetchAllPersons('');
    this.setState({
      allPersons: result.data.data.allPersons,
      errors: result.data.errors,
    });
  }

  onChange = async event => {
    event.persist();
    let name = event.target.value;
    this.setState({
      filter: name,
      person: null,
    });
    const result = await this.fetchAllPersons(event.target.value);

    if (this.state.filter !== name) { return; }

    this.setState(() => ({
      allPersons: result.data.data.allPersons,
      showFavorites: false,
      errors: result.data.errors,
    }));
  };

  onSubmit = async event => {
    const result = await this.fetchAllPersons(this.state.filter);
    this.setState({
      allPersons: result.data.data.allPersons,
      errors: result.data.errors,
    });

    event.preventDefault();
  };

  getPerson = event => {
    let name = event.target.innerHTML;
    this.fetchPerson(name);
    window.scrollTo(0, 0);
  }

  addToFavorites = event => {
    let button = event.target;
    const index = this.state.favorites.indexOf(button.value)
    if (index == -1){
      button.innerHTML = "Remove from favorites";
      this.setState(() => (this.state.favorites.push(button.value)));
      return;
    }
    button.innerHTML = "Add to favorites";
    this.setState(() => (this.state.favorites.splice(index, 1)));
  }

  back = event => {
    this.setState({ person: null });
  }

  backFromFavorites = async event => {
    this.setState({ showFavorites: false });
    const result = await this.fetchAllPersons(this.state.filter);
    this.setState({
      allPersons: result.data.data.allPersons,
      errors: result.data.errors,
    });
  }

  checkIfFavorite = name => {
    return (this.state.favorites.indexOf(name) > -1);
  }

  showFavorites = event => {
    this.setState({
      showFavorites: true,
      filter: "",
    });
    this.fetchFavorites(this.state.favorites);
  }

  fetchPerson = (name) => {
    axiosStarWarsGraphQL
      .post('', {
        query: GET_PERSON,
        variables: { name },
      })
      .then(result =>
        this.setState(() => ({
          person: result.data.data.Person,
          errors: result.data.errors,
        })),
      );
  };

  fetchAllPersons = (filter) => {
    return (
      axiosStarWarsGraphQL.post('', {
        query: GET_ALL_PERSONS,
        variables: { filter },
      })
    )
  };

  fetchFavorites = (favorites) => {
    axiosStarWarsGraphQL
      .post('', {
        query: GET_FAVORITES,
        variables: { favorites },
      })
      .then(result =>
        this.setState(() => ({
          allPersons: result.data.data.allPersons,
          errors: result.data.errors,
        })),
      );
  };

  render() {
    const { filter, person, allPersons, showFavorites, errors } = this.state;

    return (
      <div>
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor="search">
            Show characters from Star Wars
          </label>
          <input
            id="search"
            type="text"
            value={filter}
            onChange={this.onChange}
            style={{ width: '300px', marginLeft: '20px' }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />

        {person ? (
          <div>
            <a href="#top" onClick={this.back}>
              {"< Back"}
            </a>
            <Person person={person} errors={errors}/>
          </div>
        ) : (
          allPersons ? (
            <div>
              <ShowFavorites showFavorites={showFavorites} app={this}/>
              <AllPersons allPersons={allPersons} errors={errors} app={this}/>
            </div>
          ) : (
            <p>No information yet ...</p>
          )
        )}

      </div>
    );
  }
}

const AllPersons = ({ allPersons, errors, app }) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }
  return (
    <div>
      <ul>
        {allPersons.map(person => (
          <li key={person.id} class='list'>
            <a onClick={app.getPerson} href={"#" + person.name}>
              {person.name}
            </a>
            <button
              type="button"
              class="favorite-button"
              onClick={app.addToFavorites}
              value={person.name}
              id={"favorite-button-" + person.id}
            >
              {app.checkIfFavorite(person.name) ? (
                "Remove from favorites"
              ) : (
                "Add to favorites"
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
};

const Person = ({ person, errors }) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }
  return (
    <div>
      <p>
        <strong>Name:</strong>
        {person.name}
      </p>
      {person.homeworld ? (
        <p>
          <strong>Homeworld:</strong>
          {person.homeworld.name}
        </p>
      ) : (
        <p/>
      )}
      <List list={person.species} name='Species' />
      <List list={person.starships} name='Starships' />
      <Films films={person.films} />
    </div>
  )
};

const ShowFavorites = ({ showFavorites, app }) => {
  if (showFavorites){
    return (
      <div>
        <a href="#top" onClick={app.backFromFavorites}>
          {"< Back"}
        </a>
        <p>
          <strong>Favorite characters:</strong>
        </p>
      </div>
    );
  }
  if (app.state.favorites.length == 0){
    return (
      <div>
        <p>
          <strong>Characters:</strong>
        </p>
      </div>
    );
  }
  return (
    <div>
      <a href="#top" onClick={app.showFavorites}>
        {"Show Favorites"}
      </a>
      <p>
        <strong>Characters:</strong>
      </p>
    </div>
  )
};

const List = ({ list, name }) => {
  if (list.length > 0){
    return (
      <div>
        <p>
          <strong>{name}:</strong>
        </p>
        <ul>
          {list.map(item => (
            <li key={item.id} class="list">
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (<div></div>)
};

const Films = ({ films }) => (
  <div>
    <p>
      <strong>Films:</strong>
    </p>
    <ul>
      {films.map(film => (
        <li key={film.id} class="list">
          {film.title}
        </li>
      ))}
    </ul>
  </div>
);

export default App;
