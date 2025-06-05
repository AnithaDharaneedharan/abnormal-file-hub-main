import React from "react";
import { render } from "@testing-library/react";
import { FileIcon } from "../../components/FileIcon";


// Mock HeroIcons components
jest.mock("@heroicons/react/24/solid", () => ({
  DocumentIcon: () => <div data-testid="document-icon" />,
  PhotoIcon: () => <div data-testid="photo-icon" />,
  VideoCameraIcon: () => <div data-testid="video-icon" />,
  MusicalNoteIcon: () => <div data-testid="audio-icon" />,
  TableCellsIcon: () => <div data-testid="spreadsheet-icon" />,
  ArchiveBoxIcon: () => <div data-testid="archive-icon" />,
  CodeBracketIcon: () => <div data-testid="code-icon" />,
}));

describe("FileIcon", () => {
  it("renders document icon by default when no category is provided", () => {
    const { getByTestId } = render(<FileIcon category="" />);
    expect(getByTestId("document-icon")).toBeInTheDocument();
  });

  it("renders document icon for unknown category", () => {
    const { getByTestId } = render(<FileIcon category="unknown" />);
    expect(getByTestId("document-icon")).toBeInTheDocument();
  });

  const categoryTests = [
    { category: "image", testId: "photo-icon" },
    { category: "video", testId: "video-icon" },
    { category: "audio", testId: "audio-icon" },
    { category: "spreadsheet", testId: "spreadsheet-icon" },
    { category: "archive", testId: "archive-icon" },
    { category: "code", testId: "code-icon" },
    { category: "document", testId: "document-icon" },
  ];

  categoryTests.forEach(({ category, testId }) => {
    it(`renders correct icon for ${category} category`, () => {
      const { getByTestId } = render(<FileIcon category={category} />);
      expect(getByTestId(testId)).toBeInTheDocument();
    });

    it(`renders correct icon for uppercase ${category.toUpperCase()} category`, () => {
      const { getByTestId } = render(
        <FileIcon category={category.toUpperCase()} />
      );
      expect(getByTestId(testId)).toBeInTheDocument();
    });
  });

});
