"use client";

import { Component } from "react";

export class ErrorBoundary extends Component {
    constructor(props){
        super(props);
        this.state = { hasError : false };
    }

    static getDerivedStateFromError() {
        return { hasError : true }
    }

    componentDidCatch(error, info){
        console.error("Caught by ErrorBoundary: ", error, info);
        this.props.onError?.(error);
    }

    reset = () => {
        this.setState({ hasError : false})
    };

    render() {
        if (this.state.hasError) {
        return this.props.fallback ? this.props.fallback(this.reset) : null;
        }
        return this.props.children;
    }
}