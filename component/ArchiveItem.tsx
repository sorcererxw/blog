import * as React from "react";
import styled from "styled-components";
import {BlockValue, getDate, getDisplayBlockId, getTags} from "../api/notion";
import Responsive from 'react-responsive';

const Mobile = props => <Responsive {...props} maxWidth={767}/>;
const Desktop = props => <Responsive {...props} minWidth={768}/>;

const ItemTitle = styled.a`
  font-weight: 600;
  font-size: 18px;
  text-decoration-line: none;
`;

const PostItem = styled.div`
    margin: 36px 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
`;

const ItemTitleBar = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    max-width: 100%;
    box-sizing: border-box;
`;

const ItemTagBar = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: row;
`;

const Tag = styled.div`
  display: flex;
  flex-direction: row;
  margin-right: 8px;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  text-align: center;
  color:rgb(187, 187, 187);
  align-self: baseline;
`;

const PubDate = styled.span`
   align-self: baseline;
   color:rgb(187, 187, 187);
   font-size: 16px;
   font-weight: 500;
`;

interface IProps {
    blockValue: BlockValue
}

interface IState {
    _: any
}

const PostLink = (props: { page: string, title: string }) => (
    <ItemTitle href={`/post/${props.page}`}> {props.title}</ItemTitle>
);

export default class ArchiveItem extends React.Component<IProps, IState> {

    public render(): React.ReactNode {
        const it = this.props.blockValue;
        const properties = it.properties;
        if (properties === undefined) {
            return null
        }

        let tagBar = null;
        const tagItems = getTags(it);
        if (tagItems.length > 0) {
            tagBar = <ItemTagBar>
                {tagItems.map((v, k) => <Tag key={k}>{v}</Tag>)}
            </ItemTagBar>;
        }

        const title = <PostLink page={getDisplayBlockId(it.id)} title={it.properties.title[0]}/>

        const dateView = <PubDate>{getDate(it)}</PubDate>;

        const desktop = <Desktop>
            <PostItem>
                <ItemTitleBar>
                    <div>
                        {title}
                        {tagBar}
                    </div>
                    <div style={{flex: 1}}/>
                    {dateView}
                </ItemTitleBar>
            </PostItem>
        </Desktop>;

        const mobile = <Mobile>
            <PostItem>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    {title}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        {tagBar}
                        <div style={{marginTop: 4}}>{dateView}</div>
                    </div>
                </div>
            </PostItem>
        </Mobile>;

        return <div>
            {desktop}
            {mobile}
        </div>
    }
}