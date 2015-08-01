var React = require('react');
var ReactIntl = require('react-intl');
var IntlMixin  = ReactIntl.IntlMixin;
var FormattedMessage  = ReactIntl.FormattedMessage;

var TextBlockComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    return (this.props.block);
  },

  render: function() {
    if (this.state.format === 'section') {
      var self = this;
      var blocks = this.state.blocks.map(function(block, i) {
          return (<TextBlockComponent key={i} 
            prefix={self.props.prefix + '[' + i + ']'} 
            block={block} />);
        });
      return (<fieldset>
        <input type="hidden" value="section" name={this.props.prefix + '[format]'} />
        <input type="hidden" value={this.state.blocks.length} name="numblocks" />
        {blocks}
      </fieldset>);
    } else if (this.state.format === 'pragma') {
      return (<fieldset>
              <div style="background: rgb(198, 198, 237); padding: 1em;">
              <input type="hidden" value="pragma" 
               name={this.props.prefix + '[format]'} />
               <select size="1">
               <option value="child">Query Children</option>
               <option value="parents">Query Parents</option>
               <option value="dir">Directory</option>
               </select></div>
      </fieldset>);
    } else {
      var outstr = this.state.source;
      if (this.state.format === 'html') {
        outstr = this.state.htmltext;
      }
      return (<fieldset>
        <textarea rows="30" name={this.props.prefix + '[source]'} 
          className="pure-input-1" placeholder="Posting" 
          defaultValue={outstr}>
        </textarea>
        <select size="1" name={this.props.prefix + '[format]'} 
          defaultValue={this.state.format}>
        <option value="html">HTML</option>
        <option value="markdown">Markdown</option>
        </select>
      </fieldset>);
    }
  }
});

var PathNameComponent = React.createClass({
  mixins: [IntlMixin],

  getInitialState: function() {
    if (this.props.leaf) {
      return {leaf: this.props.leaf, slug: false};
    } else {
      return {slug: true};
    }
  },

  slugSwitch: function(event) {
    this.setState({slug: event.target.checked});
  },

  render: function() {
    return (<fieldset>
      <div className="pure-u-1-3">
      <input className="pure-input-1" name="root" type="text" value={this.props.path} 
        readOnly disabled />
      </div>
      <div className="pure-u-1-3">
      <input className="pure-input-1" type="text"
        defaultValue={this.state.leaf} disabled={this.state.slug} name="leaf" id="leaf"
        placeholder={this.getIntlMessage("PATH")} />
      </div>
      <div className="pure-u-1-3">
      <label htmlFor="autogenSlug" className="pure-checkbox">
        <input type="checkbox" onChange={this.slugSwitch} defaultChecked={this.state.slug} />
        <FormattedMessage message="AUTO_GENERATE_SLUG" />
      </label>
      </div>
      </fieldset>);
  }
});

var SingleError = React.createClass({
  render: function() {
    return (<li>
      {this.props.error}
      </li>);
  }
});

var ErrorsList = React.createClass({
  mixins: [IntlMixin],
  render: function() {
    if (this.props.errors) {
      return (<div><ul>
      {this.props.errors.map(function(error, i){
          return (<SingleError key={i} error={error} />);
      })}
      </ul></div>);
    } else {
      return <div />;
    }
  }
});

exports.SingleError = SingleError;
exports.ErrorsList = ErrorsList;
exports.PathNameComponent = PathNameComponent;
exports.TextBlockComponent = TextBlockComponent;
