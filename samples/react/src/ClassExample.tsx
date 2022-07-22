// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from "react";
import { exampleGetWithHttp } from "./httpApi";
import { exampleGetWithRest } from "./restApi";

type Props = {};
type State = {
  httpGetResponse: string;
  restGetResponse: string;
};

export class ClassExample extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      httpGetResponse: "This should be replaced",
      restGetResponse: "This should be replaced",
    };
  }

  async componentDidMount() {
    this.setState({
      httpGetResponse: await exampleGetWithHttp(),
      restGetResponse: await exampleGetWithRest(),
    });
  }

  render() {
    return (
      <div className="class-example">
        <div id="class-example-get-with-rest">{this.state.restGetResponse}</div>
        <br></br>
        <div id="class-example-get-with-http">{this.state.httpGetResponse}</div>
      </div>
    );
  }
}
