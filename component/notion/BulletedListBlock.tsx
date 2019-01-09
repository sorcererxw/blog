import * as React from 'react'
import styled from "styled-components";
import {BlockNode} from "../../api/notion";
import NotionBlock from "./NotionBlock";
import TextBlock from "./TextBlock";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  align-items: flex-start;
  width: 100%; 
  padding-left: 2px; 
`;

const Content = styled.div``;

const SymbolContainer = styled.div`
  display: flex;
  margin-right: 4px;
  width: 24px;
  flex-grow: 0; 
  flex-shrink: 0;
  align-items: center; 
  justify-content: center; 
  min-height: calc(1.5em);
  padding-right: 2px;
`;

const Symbol = styled.div`
  width: 6px; 
  height: 6px; 
  border-radius: 6px; 
  background: currentcolor;
`;

const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ChildrenContainer = styled.div`
    max-width: 100%;
    box-sizing: border-box;
`;

interface IProps {
    value: BlockNode
}

interface IState {
}

class BulletedListBlock extends React.Component<IProps, IState> {
    constructor(props: any) {
        super(props);
        this.state = {
            data: []
        }
    }

    public render(): React.ReactNode {
        return <Container>
            <SymbolContainer><Symbol/></SymbolContainer>
            <Content>
                {this.renderItself()}
                {this.renderChildren()}
            </Content>
        </Container>
    }

    private renderItself(): React.ReactNode {
        return <ListItem>
            <TextBlock value={this.props.value}/>
        </ListItem>
    }

    private renderChildren(): React.ReactNode {
        const blockChildren = this.props.value.children;
        if (blockChildren.length === 0) {
            return null;
        }
        return <ChildrenContainer>
            {
                blockChildren.map((v, k) => <NotionBlock key={k} block={v}/>)
            }
        </ChildrenContainer>
    }
}

export default BulletedListBlock