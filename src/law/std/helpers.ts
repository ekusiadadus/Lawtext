import { EL } from "../../node/el";
import * as std from "./stdEL";

export const paragraphItemTags = [
    "Paragraph",
    "Item",
    "Subitem1",
    "Subitem2",
    "Subitem3",
    "Subitem4",
    "Subitem5",
    "Subitem6",
    "Subitem7",
    "Subitem8",
    "Subitem9",
    "Subitem10",
] as const;

export type ParagraphItem =
    | std.Paragraph
    | std.Item
    | std.Subitem1
    | std.Subitem2
    | std.Subitem3
    | std.Subitem4
    | std.Subitem5
    | std.Subitem6
    | std.Subitem7
    | std.Subitem8
    | std.Subitem9
    | std.Subitem10
    ;

export const isParagraphItem = (el: EL): el is ParagraphItem =>
    (paragraphItemTags as readonly string[]).includes(el.tag);

export const paragraphItemTitleTags = [
    "ParagraphNum",
    "ItemTitle",
    "Subitem1Title",
    "Subitem2Title",
    "Subitem3Title",
    "Subitem4Title",
    "Subitem5Title",
    "Subitem6Title",
    "Subitem7Title",
    "Subitem8Title",
    "Subitem9Title",
    "Subitem10Title",
] as const;

export type ParagraphItemTitle =
    | std.ParagraphNum
    | std.ItemTitle
    | std.Subitem1Title
    | std.Subitem2Title
    | std.Subitem3Title
    | std.Subitem4Title
    | std.Subitem5Title
    | std.Subitem6Title
    | std.Subitem7Title
    | std.Subitem8Title
    | std.Subitem9Title
    | std.Subitem10Title
    ;

export const isParagraphItemTitle = (el: EL): el is ParagraphItemTitle =>
    (paragraphItemTitleTags as readonly string[]).includes(el.tag);

export const paragraphItemSentenceTags = [
    "ParagraphSentence",
    "ItemSentence",
    "Subitem1Sentence",
    "Subitem2Sentence",
    "Subitem3Sentence",
    "Subitem4Sentence",
    "Subitem5Sentence",
    "Subitem6Sentence",
    "Subitem7Sentence",
    "Subitem8Sentence",
    "Subitem9Sentence",
    "Subitem10Sentence",
] as const;

export type ParagraphItemSentence =
    | std.ParagraphSentence
    | std.ItemSentence
    | std.Subitem1Sentence
    | std.Subitem2Sentence
    | std.Subitem3Sentence
    | std.Subitem4Sentence
    | std.Subitem5Sentence
    | std.Subitem6Sentence
    | std.Subitem7Sentence
    | std.Subitem8Sentence
    | std.Subitem9Sentence
    | std.Subitem10Sentence
    ;

export const isParagraphItemSentence = (el: EL): el is ParagraphItemSentence =>
    (paragraphItemSentenceTags as readonly string[]).includes(el.tag);


export const listTags = ["List", "Sublist1", "Sublist2", "Sublist3"] as const;


export const articleGroupTypeChars = ["編", "章", "節", "款", "目"] as const;

export const articleGroupTags = [
    "Part",
    "Chapter",
    "Section",
    "Subsection",
    "Division",
] as const;

export type ArticleGroup =
    | std.Part
    | std.Chapter
    | std.Section
    | std.Subsection
    | std.Division
    ;

export const isArticleGroup = (el: EL): el is ArticleGroup =>
    (articleGroupTags as readonly string[]).includes(el.tag);

export const articleGroupTitleTags = [
    "PartTitle",
    "ChapterTitle",
    "SectionTitle",
    "SubsectionTitle",
    "DivisionTitle",
] as const;

export type ArticleGroupTitle =
    | std.PartTitle
    | std.ChapterTitle
    | std.SectionTitle
    | std.SubsectionTitle
    | std.DivisionTitle
    ;

export const isArticleGroupTitle = (el: EL): el is ArticleGroupTitle =>
    (articleGroupTitleTags as readonly string[]).includes(el.tag);
