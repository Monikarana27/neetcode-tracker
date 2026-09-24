import java.util.*;

public class Template_grid {
static long paths(int[][] blocked) {
    if(blocked.length==0 || blocked[0].length==0)return 0;
    long[] dp=new long[blocked[0].length];dp[0]=1;
    for(int[] row:blocked) for(int c=0;c<row.length;c++) {
        if(row[c]==1)dp[c]=0;else if(c>0)dp[c]+=dp[c-1];
    }
    return dp[dp.length-1]; // Rectangular grid; counts must fit long.
}
}
