import java.util.*;

public class Template_fenwick {
static class Fenwick {
    long[] bit;Fenwick(int n){bit=new long[n+1];}
    void add(int index,long delta){for(int i=index+1;i<bit.length;i+=i&-i)bit[i]+=delta;}
    long prefix(int end){long sum=0;for(int i=end;i>0;i-=i&-i)sum+=bit[i];return sum;}
    long range(int l,int r){return prefix(r)-prefix(l);} // [l,r)
}
}
