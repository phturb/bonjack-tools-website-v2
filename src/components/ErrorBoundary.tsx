import React from "react";
import { Button, Container, Typography } from "@mui/material";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Container>
          <Typography variant="h4" component="h4" align="center">
            Something went wrong
          </Typography>
          <Typography align="center">{this.state.error.message}</Typography>
          <Button onClick={() => this.setState({ error: null })}>Retry</Button>
        </Container>
      );
    }
    return this.props.children;
  }
}
