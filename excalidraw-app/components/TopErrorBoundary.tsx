import { t } from "@excalidraw/excalidraw/i18n";
import React from "react";

interface TopErrorBoundaryState {
  hasError: boolean;
  localStorage: string;
}

export class TopErrorBoundary extends React.Component<
  any,
  TopErrorBoundaryState
> {
  state: TopErrorBoundaryState = {
    hasError: false,
    localStorage: "",
  };

  render() {
    return this.state.hasError ? this.errorSplash() : this.props.children;
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const _localStorage: any = {};
    for (const [key, value] of Object.entries({ ...localStorage })) {
      try {
        _localStorage[key] = JSON.parse(value);
      } catch (error: any) {
        _localStorage[key] = value;
      }
    }

    console.error(error, errorInfo);
    this.setState(() => ({
      hasError: true,
      localStorage: JSON.stringify(_localStorage),
    }));
  }

  private selectTextArea(event: React.MouseEvent<HTMLTextAreaElement>) {
    if (event.target !== document.activeElement) {
      event.preventDefault();
      (event.target as HTMLTextAreaElement).select();
    }
  }

  private async createGithubIssue() {
    let body = "";
    try {
      const templateStrFn = (
        await import(
          /* webpackChunkName: "bug-issue-template" */ "../bug-issue-template"
        )
      ).default;
      body = encodeURIComponent(templateStrFn());
    } catch (error: any) {
      console.error(error);
    }

    window.open(
      `https://github.com/excalidraw/excalidraw/issues/new?body=${body}`,
      "_blank",
      "noopener noreferrer",
    );
  }

  private renderButtonTranslation(translation: string, onClick: () => void) {
    const match = translation.match(/^(.*)<button>(.*)<\/button>(.*)$/s);
    if (!match) {
      return translation;
    }
    const [, prefix, buttonLabel, suffix] = match;
    return (
      <>
        {prefix}
        <button onClick={onClick}>{buttonLabel}</button>
        {suffix}
      </>
    );
  }

  private errorSplash() {
    return (
      <div className="ErrorSplash excalidraw">
        <div className="ErrorSplash-messageContainer">
          <div className="ErrorSplash-paragraph bigger align-center">
            {this.renderButtonTranslation(t("errorSplash.headingMain"), () =>
              window.location.reload(),
            )}
          </div>
          <div className="ErrorSplash-paragraph align-center">
            {this.renderButtonTranslation(
              t("errorSplash.clearCanvasMessage"),
              () => {
                try {
                  localStorage.clear();
                  window.location.reload();
                } catch (error: any) {
                  console.error(error);
                }
              },
            )}
            <br />
            <div className="smaller">
              <span role="img" aria-label="warning">
                ⚠️
              </span>
              {t("errorSplash.clearCanvasCaveat")}
              <span role="img" aria-hidden="true">
                ⚠️
              </span>
            </div>
          </div>
          <div>
            <div className="ErrorSplash-paragraph">
              {this.renderButtonTranslation(
                t("errorSplash.openIssueMessage"),
                () => this.createGithubIssue(),
              )}
            </div>
            <div className="ErrorSplash-paragraph">
              <div className="ErrorSplash-details">
                <label>{t("errorSplash.sceneContent")}</label>
                <textarea
                  rows={5}
                  onPointerDown={this.selectTextArea}
                  readOnly={true}
                  value={this.state.localStorage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
