import java.util.*;

public class Template_dsu {
static class DSU {
    int[] parent,size;
    DSU(int n){parent=new int[n];size=new int[n];for(int i=0;i<n;i++){parent[i]=i;size[i]=1;}}
    int find(int x){while(x!=parent[x]){parent[x]=parent[parent[x]];x=parent[x];}return x;}
    boolean union(int a,int b){
        a=find(a);b=find(b);if(a==b)return false;
        if(size[a]<size[b]){int t=a;a=b;b=t;}
        parent[b]=a;size[a]+=size[b];return true;
    }
}
}
